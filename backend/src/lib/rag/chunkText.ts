import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const chunkText = async (text: string) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  return splitter.splitText(text);
};
