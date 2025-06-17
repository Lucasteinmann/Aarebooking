import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AuthButton } from '../auth/auth-button'
import { Button } from '../ui/button'

function NavbarAdmin() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
         <div className="flex gap-5 items-center font-semibold">
                <Link href={'/'}>
                 <Image 
                 src="/aarebootslogo.png"
                 width={40}
                 height={40}
                 alt="Logo"
                 />
                </Link>
             <Link className="font-bold text-" href={"/"}>Aarebootsvermietung.ch</Link>
             <div className="flex items-center gap-2">
            </div>
         </div>
         <AuthButton/>
      </div>
    </nav>
  )
}

export { NavbarAdmin }
