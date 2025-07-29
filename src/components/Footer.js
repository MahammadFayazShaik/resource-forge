import React from 'react';
import './Footer.css'; 
import { Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span>© 2025 All copy rights are reserved</span>
        <a href="https://portfolio-itsmefayaz.vercel.app/ " target="_blank" rel="noopener noreferrer">
          <Globe size={16} />
          Mahammad Fayaz
        </a>
      </div>
    </footer>
  );
};

export default Footer;
