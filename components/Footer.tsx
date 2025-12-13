import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/20 py-8 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>© 2024 CheckMate Jackpot. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Rules</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
};
