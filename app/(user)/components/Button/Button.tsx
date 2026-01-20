import React from 'react';
import './button.scss'; // Import the (empty) styles file

// Define the props the component accepts
interface ButtonProps {
  text: string;    // The text displayed (required)
  href?: string;   // Optional URL. If provided and non-empty, renders as a link.
  className?: string; // Optional additional class names
  onClick?: (event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void; // Optional click handler
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ text, href, className, onClick, disabled = false }) => {
  const staticClassName = 'small-button'; // The static class name
  const combinedClassName = className ? `${staticClassName} ${className}` : staticClassName;

  // Render as a link only if href is a non-empty string
  if (href && !disabled) {
    return (
      <a href={href} className={combinedClassName} onClick={onClick}>
        {text}
      </a>
    );
  }

  // Otherwise, render as a standard button
  return (
    <button type="button" className={combinedClassName} onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
};

export default Button;
