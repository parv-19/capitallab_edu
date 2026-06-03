from __future__ import annotations

import json
import re
import sys
import traceback
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


def clean_text(text: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", text.replace("\x00", " ").replace("\r\n", "\n"))).strip()


def extract_txt(file_path: Path) -> dict:
    text = clean_text(file_path.read_text(encoding="utf-8", errors="ignore"))
    return {
        "pages": [{"pageNumber": 1, "text": text}] if text else [],
        "strategy": "python_txt",
        "warnings": [],
    }


def extract_docx(file_path: Path) -> dict:
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    warnings: list[str] = []

    with zipfile.ZipFile(file_path) as archive:
        with archive.open("word/document.xml") as handle:
            tree = ET.parse(handle)

    paragraphs: list[str] = []
    for paragraph in tree.findall(".//w:p", namespace):
        runs = []
        for node in paragraph.findall(".//w:t", namespace):
            if node.text:
                runs.append(node.text)
        text = clean_text("".join(runs))
        if text:
            paragraphs.append(text)

    combined = "\n\n".join(paragraphs)
    if not combined:
        warnings.append("DOCX contained no extractable paragraph text.")

    return {
        "pages": [{"pageNumber": 1, "text": combined}] if combined else [],
        "strategy": "python_docx_zipxml",
        "warnings": warnings,
    }


def _extract_pdf_with_pymupdf(file_path: Path) -> dict:
    warnings: list[str] = []

    try:
        import pymupdf  # type: ignore
    except Exception:
        import fitz as pymupdf  # type: ignore

    doc = pymupdf.open(str(file_path))
    pages = []

    for index, page in enumerate(doc, start=1):
        text = ""

        try:
            blocks = page.get_text("blocks", sort=True)
            if blocks:
                ordered = []
                for block in blocks:
                    if len(block) >= 5 and isinstance(block[4], str):
                        ordered.append(block[4])
                text = "\n".join(ordered)
        except TypeError:
            blocks = page.get_text("blocks")
            if blocks:
                ordered = []
                for block in blocks:
                    if len(block) >= 5 and isinstance(block[4], str):
                        ordered.append(block[4])
                text = "\n".join(ordered)
        except Exception as error:
            warnings.append(f"Block extraction failed on page {index}: {error}")

        if not text:
            try:
                text = page.get_text("text", sort=True)
            except TypeError:
                text = page.get_text("text")

        cleaned = clean_text(text)
        if cleaned:
            pages.append({"pageNumber": index, "text": cleaned})

    return {
        "pages": pages,
        "strategy": "pymupdf_blocks",
        "warnings": warnings,
    }


def _extract_pdf_with_pymupdf4llm(file_path: Path) -> dict:
    import pymupdf4llm  # type: ignore

    markdown = pymupdf4llm.to_markdown(str(file_path))
    cleaned = clean_text(markdown)
    return {
        "pages": [{"pageNumber": 1, "text": cleaned}] if cleaned else [],
        "strategy": "pymupdf4llm_markdown",
        "warnings": [],
    }


def _extract_pdf_with_unstructured(file_path: Path) -> dict:
    from unstructured.partition.pdf import partition_pdf  # type: ignore

    elements = partition_pdf(filename=str(file_path))
    texts = [clean_text(str(element)) for element in elements]
    combined = "\n\n".join(text for text in texts if text)
    return {
        "pages": [{"pageNumber": 1, "text": combined}] if combined else [],
        "strategy": "unstructured_partition_pdf",
        "warnings": [],
    }


def extract_pdf(file_path: Path) -> dict:
    strategies = [
        _extract_pdf_with_pymupdf4llm,
        _extract_pdf_with_pymupdf,
        _extract_pdf_with_unstructured,
    ]
    errors: list[str] = []

    for extractor in strategies:
        try:
            result = extractor(file_path)
            if result.get("pages"):
                warnings = result.get("warnings", [])
                warnings.extend(errors)
                result["warnings"] = warnings
                return result
        except Exception as error:
            errors.append(f"{extractor.__name__}: {error}")

    raise RuntimeError("No Python PDF extraction strategy succeeded. " + " | ".join(errors))


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        file_path = Path(payload["filePath"]).resolve()
        file_type = str(payload.get("fileType", "")).strip().lower()

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if file_type == "pdf":
            result = extract_pdf(file_path)
        elif file_type == "docx":
            result = extract_docx(file_path)
        else:
            result = extract_txt(file_path)

        print(json.dumps(result, ensure_ascii=True))
        return 0
    except Exception:
        traceback.print_exc(file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
