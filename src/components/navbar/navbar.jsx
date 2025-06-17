"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '../ui/button'
import { MenuButton } from './menu-button'
import { NavMenu } from './navmenu' // Corrected import: removed duplicate "Navmenu"
import { cn } from "@/lib/utils" // Import cn for conditional class names

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);
  const navbarRef = useRef(null); // Ref for the main nav element to get its height

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      const navHeight = navbarRef.current?.offsetHeight || 64; // Get actual nav height or fallback

      if (isMobileMenuOpen) {
        setShowNavbar(true); // Always show navbar if mobile menu is open
        lastScrollY.current = currentScrollY < 0 ? 0 : currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > navHeight) {
        // Scrolling down and past the navbar height
        setShowNavbar(false);
      } else {
        // Scrolling up or at the top (or not scrolled past navbar yet)
        setShowNavbar(true);
      }
      lastScrollY.current = currentScrollY < 0 ? 0 : currentScrollY;
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [isMobileMenuOpen]); // Re-run effect if isMobileMenuOpen changes

  return (
    <div
      className={cn(
        "w-full sticky top-0 z-40 transition-transform duration-300 ease-in-out",
        showNavbar ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <nav ref={navbarRef} className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background">
        {/* 
          - bg-background: Provides a solid background for the sticky navbar. 
        */}
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
                <Link href={'/'}>
                 <Image 
                 src="/aarebootslogo.png"
                 width={40}
                 height={40}
                 alt="Logo"
                 />
                </Link>
             <Link className="font-bold hidden md:flex" href={"/"}>Aarebootsvermietung.ch</Link>
            <div className="hidden md:flex items-center gap-2"> {/* Desktop NavMenu container, hidden on mobile */}
                <NavMenu/>
            </div>
         </div>
          <div className='flex flex-row gap-2 items-center'> {/* Added items-center for vertical alignment */}
            {/* MenuButton is wrapped and only shown on mobile (md:hidden) */}
            <div className="md:hidden">
              <MenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            </div>
            <Button href={'#booking'} >Book Now</Button>
         </div>
        </div>
      </nav>

      {/* Mobile Menu Section - Appears below Navbar and pushes content */}
      <div
        className={cn(
          "w-full bg-background md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          // md:hidden: Ensures this menu is only for mobile screens.
          // overflow-hidden: Necessary for the max-height transition to work correctly.
          // transition-all duration-300 ease-in-out: Smooth animation for expand/collapse.
          isMobileMenuOpen 
            ? "max-h-[500px] py-4 border-b border-b-foreground/10" // State when open: large enough max-height, padding, and bottom border
            : "max-h-0 py-0 border-none" // State when closed: zero height, no padding, no border
        )}
      >
        <div className="max-w-7xl mx-auto px-5"> {/* Inner container to align content with navbar */}
          <div className='grid gap-2'>
            {/* Populate with your mobile navigation links. Example: */}
            <Link href="/docs" className="block py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md px-3">Introduction</Link>
            <Link href="/docs/installation" className="block py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md px-3">Installation</Link>
            <Link href="/docs/primitives/typography" className="block py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md px-3">Typography</Link>
            {/* You can map over items from NavMenu or create a simplified list for mobile */}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Navbar }
