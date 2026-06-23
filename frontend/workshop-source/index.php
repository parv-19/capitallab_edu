<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pageTitle = "Welcome To Capital Lab";
$formError = $_SESSION['form_error'] ?? '';
unset($_SESSION['form_error']);

include("header.php"); ?>


    <main id="main-content">
        <section class="hero-section" id="home" aria-labelledby="hero-title">
            <div class="container hero-grid">
                <div class="hero-copy" data-animate="fade-left">
                    <span class="eyebrow">2-Day Live Workshop</span>
                    <h1 id="hero-title">Finance Foundation Workshop</h1>
                    <p class="hero-lead">Master the fundamentals of finance, investing, stock markets, and financial analysis through a practical workshop designed for students, aspiring finance professionals, and future industry leaders.</p>
                    <ul class="event-list" aria-label="Workshop details">
                        <li><i class="fa-solid fa-calendar-days" aria-hidden="true"></i><span>4th & 5th July 2026</span></li>
                        <li><i class="fa-solid fa-globe" aria-hidden="true"></i><span>Live Online Across India</span></li>
                        <li><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>Offline at Capital Lab Education, Sola, Ahmedabad</span></li>
                        <li><i class="fa-solid fa-award" aria-hidden="true"></i><span>Certificate of Participation Included</span></li>
                    </ul>
                    <div class="hero-actions">
                        <a class="btn btn-primary" href="https://payments.cashfree.com/forms/finance-foundation-workshop">Register Now @ Rs.199</a>
                        <a class="btn btn-outline" href="#learn">See Curriculum</a>
                    </div>
                    <p class="micro-proof"><i class="fa-solid fa-shield-check" aria-hidden="true"></i> Beginner-friendly, career-oriented, and built for practical clarity.</p>
                </div>

                <aside class="lead-panel" id="register" aria-labelledby="lead-form-title" data-animate="fade-up">
                    <div class="lead-panel-head">
                        <div>
                            <span class="form-kicker">Reserve your seat</span>
                            <h2 id="lead-form-title">Start your finance journey</h2>
                        </div>
                        <img src="assets/capital-lab-logo.png" alt="" aria-hidden="true">
                    </div>
                    <form class="lead-form" id="hero-form" action="mail-send.php" method="post" data-lead-form>
  <input type="hidden" name="form_name" value="Capital Lab Finance Workshop">

  <!-- Honeypot Field -->
  <div class="hp-field wide" aria-hidden="true">
    <label>Website
      <input type="text" name="website" tabindex="-1" autocomplete="off">
    </label>
  </div>

  <div class="form-grid">

    <label>Full Name
      <input 
        type="text" 
        name="name" 
        placeholder="Your name" 
        autocomplete="name" 
        minlength="2" 
        maxlength="80" 
        required>
    </label>

    <label>Phone Number
      <input 
        type="tel" 
        name="number" 
        placeholder="+91" 
        autocomplete="tel" 
        minlength="10" 
        maxlength="15" 
        required>
    </label>

    <label>Email Address
      <input 
        type="email" 
        name="email" 
        placeholder="you@example.com" 
        autocomplete="email" 
        maxlength="120" 
        required>
    </label>

    <label>Preferred Mode
      <select name="subject" required>
        <option value="">Choose one</option>
        <option value="Live Online">Live Online</option>
        <option value="Offline Ahmedabad">Offline Ahmedabad</option>
      </select>
    </label>

    <label class="wide">I am currently a
      <select name="message" required>
        <option value="">Select your stage</option>
        <option value="Commerce Student">Commerce Student</option>
        <option value="CFA / US CMA Aspirant">CFA / US CMA Aspirant</option>
        <option value="MBA Finance Student">MBA Finance Student</option>
        <option value="Young Professional">Young Professional</option>
        <option value="Finance Enthusiast">Finance Enthusiast</option>
      </select>
    </label>

    <label class="consent-line wide">
      <input type="checkbox" name="consent" required>
      <span>I agree to be contacted about this workshop.</span>
    </label>

<label class="captcha-line wide">Security Check
  <div class="captcha-inline">
    <input 
      name="captcha" 
      id="captcha" 
      placeholder="Captcha Code *" 
      class="form-control" 
      type="text" 
      autocomplete="off" 
      required>

    <img src="captcha.php" class="capside" alt="Captcha">
  </div>
</label>

  </div>

  <!-- <button class="btn btn-primary full-width" type="submit" name="submit" value="Submit Now!">
    Reserve My Seat
  </button> -->
  <a href="https://payments.cashfree.com/forms/finance-foundation-workshop" class="btn btn-primary full-width" type="submit" name="submit">Reserve My Seat</a>

  <p class="form-note">Limited seats. Workshop details will be shared after registration.</p>
  <div class="form-alert<?php echo $formError !== '' ? ' is-visible is-error' : ''; ?>" role="status" aria-live="polite"><?php echo htmlspecialchars($formError, ENT_QUOTES, 'UTF-8'); ?></div>
</form>
                </aside>
            </div>
        </section>

        <section class="section section-white" id="outcomes" aria-labelledby="outcomes-title">
            <div class="container">
                <div class="section-heading text-center" data-animate="fade-up">
                    <span class="eyebrow">What You'll Walk Away With</span>
                    <h2 id="outcomes-title">Knowledge, confidence, and clarity to begin in finance.</h2>
                    <p>The workshop is designed to turn big finance topics into practical first steps.</p>
                </div>
                <div class="outcome-grid">
                    <article class="outcome-card" data-animate="fade-up">
                        <span class="number">01</span>
                        <h3>A Clear Understanding of Finance Careers</h3>
                        <p>Explore Financial Analysis, Investment Banking, Equity Research, Wealth Management, CFA, and US CMA, then understand which path aligns with your goals.</p>
                    </article>
                    <article class="outcome-card" data-animate="fade-up">
                        <span class="number">02</span>
                        <h3>The Foundations of Smart Money Management</h3>
                        <p>Learn principles that help successful professionals manage, save, and grow money effectively from an early stage.</p>
                    </article>
                    <article class="outcome-card" data-animate="fade-up">
                        <span class="number">03</span>
                        <h3>Confidence to Understand Financial Markets</h3>
                        <p>Move beyond confusing jargon and see how stocks, mutual funds, and financial markets actually work.</p>
                    </article>
                    <article class="outcome-card" data-animate="fade-up">
                        <span class="number">04</span>
                        <h3>The Ability to Analyze Businesses</h3>
                        <p>Learn how investors and finance professionals evaluate companies through statements, profitability metrics, and financial indicators.</p>
                    </article>
                    <article class="outcome-card" data-animate="fade-up">
                        <span class="number">05</span>
                        <h3>A Roadmap for Your Finance Journey</h3>
                        <p>Understand the skills, certifications, and next steps required to build a successful career in finance.</p>
                    </article>
                    <article class="outcome-card outcome-feature" data-animate="fade-up">
                        <span class="number">06</span>
                        <h3>Live Q&A and Career Guidance</h3>
                        <p>Ask Harsh Trivedi questions about finance careers, CFA, US CMA, higher studies, and industry opportunities.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="section section-tint" id="attend" aria-labelledby="attend-title">
            <div class="container">
                <div class="split-heading" data-animate="fade-left">
                    <div>
                        <span class="eyebrow">Who Should Attend?</span>
                        <h2 id="attend-title">Designed for Future Finance Professionals</h2>
                    </div>
                    <p>Ideal for learners who want a practical first layer before deeper finance certifications, markets, or career decisions.</p>
                </div>
                <div class="audience-grid">
                    <article class="audience-card" data-animate="fade-up"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>
                        <h3>Commerce Students</h3>
                        <p>12th, B.Com, and BBA students who want strong finance fundamentals before entering the professional world.</p>
                    </article>
                    <article class="audience-card" data-animate="fade-up"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i>
                        <h3>CFA and US CMA Aspirants</h3>
                        <p>Build familiarity with core finance concepts used in business, investing, and management accounting.</p>
                    </article>
                    <article class="audience-card" data-animate="fade-up"><i class="fa-solid fa-building-columns" aria-hidden="true"></i>
                        <h3>MBA Finance Students</h3>
                        <p>Strengthen analytical, market, and investment-related skills with a practical workshop format.</p>
                    </article>
                    <article class="audience-card" data-animate="fade-up"><i class="fa-solid fa-briefcase" aria-hidden="true"></i>
                        <h3>Finance Enthusiasts & Young Professionals</h3>
                        <p>Learn practical money management and investing principles that support smarter early decisions.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="section section-white" id="learn" aria-labelledby="learn-title">
            <div class="container">
                <div class="section-heading text-center" data-animate="fade-up">
                    <span class="eyebrow">What You'll Learn</span>
                    <h2 id="learn-title">A Practical Introduction to the World of Finance</h2>
                    <p>Core topics are arranged as a simple learning path, from personal money habits to company analysis.</p>
                </div>
                <div class="learning-flow" aria-label="Workshop curriculum">
                    <article class="learning-item" data-animate="fade-up">
                        <div class="learning-icon"><i class="fa-solid fa-wallet" aria-hidden="true"></i></div>
                        <div><span class="lesson-tag">Module 01</span>
                            <h3>Personal Finance & Budgeting</h3>
                            <p>Manage money through budgeting, saving strategies, emergency funds, and financial goal setting.</p>
                        </div>
                    </article>
                    <article class="learning-item" data-animate="fade-up">
                        <div class="learning-icon"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i></div>
                        <div><span class="lesson-tag">Module 02</span>
                            <h3>Stock Market Basics</h3>
                            <p>Understand how stock markets operate, including NSE, BSE, indices, and investor participation.</p>
                        </div>
                    </article>
                    <article class="learning-item" data-animate="fade-up">
                        <div class="learning-icon"><i class="fa-solid fa-seedling" aria-hidden="true"></i></div>
                        <div><span class="lesson-tag">Module 03</span>
                            <h3>Mutual Funds & Investing</h3>
                            <p>Explore SIPs, mutual funds, compounding, risk management, and long-term wealth-building strategies.</p>
                        </div>
                    </article>
                    <article class="learning-item" data-animate="fade-up">
                        <div class="learning-icon"><i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i></div>
                        <div><span class="lesson-tag">Module 04</span>
                            <h3>Financial Statement Analysis</h3>
                            <p>Read Profit & Loss Statements, Balance Sheets, Cash Flow Statements, and evaluate company performance.</p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section class="section mentor-section" id="mentor" aria-labelledby="mentor-title">
            <div class="container mentor-grid">
                <div class="mentor-copy" data-animate="fade-left">
                    <span class="eyebrow">Meet Your Mentor</span>
                    <h2 id="mentor-title">Learn From Someone Who's Done It</h2>
                    <h3>Harsh Trivedi</h3>
                    <p class="mentor-role">Finance Professional & Lead Instructor - Capital Lab Education</p>
                    <p>With over 10 years of hands-on experience in financial services, Harsh brings practical depth that goes far beyond textbooks. His experience spans equity valuation, real estate valuation, credit analysis, and financial analysis.</p>
                    <p>Having progressed through the CFA program himself, he understands the challenges students face and explains complex concepts with clarity, structure, and real-world context.</p>
                    <div class="mentor-badges" aria-label="Mentor credentials"><span>CFA Level II</span><span>MBA</span><span>PGDM</span><span>B.Com</span></div>
                    <dl class="stats-row">
                        <div><dt>10+</dt>
                            <dd>Years of expertise</dd>
                        </div>
                        <div><dt>500+</dt>
                            <dd>Students trained</dd>
                        </div>
                        <div><dt>95%</dt>
                            <dd>Student satisfaction</dd>
                        </div>
                    </dl>
                </div>
                <div class="mentor-photo-wrap" data-animate="fade-up">
                    <img src="assets/harsh-trivedi.jpeg" alt="Harsh Trivedi, Finance Professional and Lead Instructor">
                </div>
            </div>
        </section>

        <section class="section section-white" id="benefits" aria-labelledby="benefits-title">
            <div class="container">
                <div class="section-heading text-center" data-animate="fade-up">
                    <span class="eyebrow">Workshop Benefits</span>
                    <h2 id="benefits-title">What You'll Receive</h2>
                    <p>A compact workshop built to help learners move from curiosity to confident next steps.</p>
                </div>
                <div class="benefit-grid">
                    <article class="benefit-card" data-animate="fade-up"><i class="fa-solid fa-certificate" aria-hidden="true"></i>
                        <h3>Certificate of Participation</h3>
                        <p>Recognize your commitment to learning finance fundamentals.</p>
                    </article>
                    <article class="benefit-card" data-animate="fade-up"><i class="fa-solid fa-gift" aria-hidden="true"></i>
                        <h3>Scholarship Opportunities</h3>
                        <p>Unlock exclusive opportunities with scholarship support up to 50%.</p>
                    </article>
                    <article class="benefit-card" data-animate="fade-up"><i class="fa-solid fa-compass" aria-hidden="true"></i>
                        <h3>Career Guidance Session</h3>
                        <p>Get clarity on CFA, US CMA, MBA Finance, and other finance career pathways.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="section faq-section" id="faq" aria-labelledby="faq-title">
            <div class="container">
                <div class="section-heading text-center" data-animate="fade-up">
                    <span class="eyebrow">FAQ</span>
                    <h2 id="faq-title">Frequently Asked Questions</h2>
                </div>
                <div class="faq-list" data-animate="fade-up">
                    <details open>
                        <summary>Who can attend this workshop?</summary>
                        <p>Students, graduates, finance enthusiasts, CFA aspirants, US CMA aspirants, and young professionals can attend.</p>
                    </details>
                    <details>
                        <summary>Do I need prior finance knowledge?</summary>
                        <p>No. The workshop is beginner-friendly and designed to build foundational knowledge from the ground up.</p>
                    </details>
                    <details>
                        <summary>Is the workshop online or offline?</summary>
                        <p>The workshop is available online across India and offline at Capital Lab Education in Sola, Ahmedabad.</p>
                    </details>
                    <details>
                        <summary>Will I receive a certificate?</summary>
                        <p>Yes. All participants receive a Certificate of Participation.</p>
                    </details>
                    <details>
                        <summary>Is this related to CFA or US CMA coaching?</summary>
                        <p>No. This Finance Foundation Workshop builds core finance knowledge and helps participants explore finance careers.</p>
                    </details>
                </div>
            </div>
        </section>

        <section class="final-cta" aria-labelledby="final-cta-title">
            <div class="container text-center" data-animate="fade-up">
                <span class="eyebrow">Still thinking about it?</span>
                <h2 id="final-cta-title">Build the knowledge, skills, and confidence needed to succeed in finance.</h2>
                <p>4th & 5th July 2026 | Live Online + Offline Ahmedabad | Certificate Included</p>
                <a class="btn btn-secondary" href="https://payments.cashfree.com/forms/finance-foundation-workshop">Register Now</a>
            </div>
        </section>
    </main>

   <?php include("footer.php"); ?>
