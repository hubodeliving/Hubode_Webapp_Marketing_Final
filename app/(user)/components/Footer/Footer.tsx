import React from 'react';
import './footer.scss'; // Styles for this component
import Link from 'next/link'; // Import Link for Next.js routing

const Footer = () => {
  // Define link data for cleaner rendering
  const hubodeLinks = [
    { href: "/", text: "Home" },
    { href: "/about", text: "About" },
    // { href: "/community", text: "Community" },
    { href: "/career", text: "Careers" },
    { href: "/blog", text: "Blog" },
    { href: "/contact", text: "Contact" },
  ];

  const locationLinks = [
    { href: "/#find-your-home", text: "Kozhikode" },
  ];

  const quickLinks = [
    { href: "/faq", text: "FAQ" },
    // { href: "/support", text: "Report an Issue" },
    { href: "/terms", text: "Terms and Conditions" }, // Use one consistent path
    { href: "/privacy-policy", text: "Privacy & Policy" },
    { href: "/refund-policy", text: "Refund Policy" },
  ];

  // Social Links (replace # with actual URLs)
  const socialLinks = [
    { href: "https://www.instagram.com/hubodeliving/", iconSrc: "/images/insta-white.svg", alt: "Instagram" },
    { href: "#", iconSrc: "/images/fb-white.svg", alt: "Facebook" },
    { href: "#", iconSrc: "/images/x-white.svg", alt: "X (Twitter)" },
  ];


  return (
    <footer className='footer-container-main flex items-center justify-center'>
        <div className="footer-container container">

            <div className="links-container-main">
                {/* Column 1: Logo and Socials */}
                <div className="footer-column logo-column">
                    <Link href="/" className="footer-logo-link">
                      <img src="/images/footer-logo.svg" alt="Hubode Logo" className='footer-logo'/>
                    </Link>
                    <div className="social-icons-container">
                        {socialLinks.map((social, index) => (
                          <a href={social.href} key={index} target="_blank" rel="noopener noreferrer" aria-label={social.alt}>
                              <img src={social.iconSrc} alt={social.alt} />
                          </a>
                        ))}
                    </div>
                </div>

                {/* Column 2: Hubode Links */}
                <div className="footer-column links-column">
                    <h5>Hubode</h5>
                    <div className="links">
                        {hubodeLinks.map((link, index) => (
                           <Link href={link.href} key={index}>{link.text}</Link>
                        ))}
                    </div>
                </div>

                {/* Column 3: Locations Links */}
                <div className="footer-column links-column">
                    <h5>Locations</h5>
                    <div className="links">
                         {locationLinks.map((link, index) => (
                           <Link href={link.href} key={index}>{link.text}</Link>
                        ))}
                    </div>
                </div>

                {/* Column 5: Quick Links */}
                <div className="footer-column links-column">
                    <h5>Quick Links</h5>
                    <div className="links">
                         {quickLinks.map((link, index) => (
                           <Link href={link.href} key={index}>{link.text}</Link>
                        ))}
                    </div>
                </div>

                {/* Column 4: Contact */}
                <div className="footer-column links-column contact-column">
                    <h5>Contact</h5>
                    <div className="links contact-links">
                        {/* <a href="tel:+918714339611">
                          <span className="contact-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" role="img" focusable="false">
                              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1v3.64a1 1 0 01-.93 1c-.3.02-.6.03-.91.03C11.72 21.18 2.82 12.28 2.82 1.84c0-.31.01-.61.03-.91A1 1 0 013.85 0h3.64a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.2 2.2z" />
                            </svg>
                          </span>
                          +91 8714339611
                        </a> */}
                        <a href="mailto:support@hubodeliving.com">
                          <span className="contact-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" role="img" focusable="false">
                              <path d="M2.5 5h19a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-19A1.5 1.5 0 011 17.5v-11A1.5 1.5 0 012.5 5zm.5 2v.17l8.45 5.64a1 1 0 001.1 0L21 7.17V7H3zm18 10v-7.24l-6.77 4.52a3 3 0 01-3.46 0L4 9.76V17h17z" />
                            </svg>
                          </span>
                          support@hubodeliving.com
                        </a>
                    </div>
                </div>


            </div>

            {/* Bottom Section */}
            <div className="bottom-text-container">
                <h5>A hub to connect, an abode to belong</h5>
                <p>Copyright Ⓒ Owned by Msphere Holdings Private Limited</p> {/* Using HTML entity for copyright */}
            </div>

        </div>
    </footer>
    //sdfsdf
  );
};

export default Footer;
