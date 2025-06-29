"use client";

import Logo from "./logo";
import Actions from "./actions";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/75 to-transparent">
      <div className="container mx-auto p-4">
        <div className="flex items-center">
          <Logo className="flex-1" />
          <Actions />
        </div>
      </div>
    </header>
  );
}
