import { ThemeSwitcher } from "@/components/theme-switcher";
import { Navbar } from "@/components/navbar/navbar"
import { Hero } from "@/components/hero";
import { RaftCards } from "@/components/raft-cards";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navbar/>
       <div className="flex-1 w-full flex flex-col items-center">
        <div className="flex-1 flex flex-col gap-20 w-full max-w-6xl p-5"> 
          <Hero />
          <RaftCards/>
        </div>
       </div>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <ThemeSwitcher/>
      </footer>
    </main>
  );
}
