"use client"
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  
  const router = useRouter();

  return (
    <section className="relative pt-20 pb-20 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-on-surface leading-tight tracking-tight mb-8">
          Welcome to <br />
          <span className="text-primary">BluEdu</span>
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-16 leading-relaxed">
          BluEdu turns your Computer Science materials into informational videos. <a className="text-primary" href="/sign-in">Sign in</a> or <a className="text-primary" href="/sign-up">create an account</a> to get started.
        </p>
      </div>
      <section className="py-24 px-6 bg-surface-container-low rounded-xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-on-surface mb-4">How it Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-surface-container-high shadow-neomorph-raised flex flex-col items-center text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-3">Upload Your Documents</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Upload PDFs, Documents, or Markdown file computer science notes. Select keywords and add prompts to help generate your video.</p>
            </div>
            <div className="p-8 rounded-3xl bg-surface-container-high shadow-neomorph-raised flex flex-col items-center text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-sm">psychology</span>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-3">AI Video Generation</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Our system will read through your document, prompts, and keywords to generate a short educational video tailored to your needs.</p>
            </div>
            <div className="p-8 rounded-3xl bg-surface-container-high shadow-neomorph-raised flex flex-col items-center text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-sm">download_done</span>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-3">Review & Export</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Make edits, review accuracy score, and view your final video.</p>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto relative group cursor-pointer mt-16">
          <div className="aspect-video rounded-3xl overflow-hidden shadow-neomorph-raised bg-surface-container-high relative">
            <div className="absolute inset-0 flex items-center justify-center bg-on-surface/5 group-hover:bg-on-surface/0 transition-colors duration-500">
              <div className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-4xl fill-current">play_arrow</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-on-surface/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                <span className="text-white font-label text-xs uppercase tracking-widest">Demo video can go here</span>
              </div>
            </div>
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-8xl text-outline-variant opacity-20">movie_filter</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-secondary-container/20 rounded-full blur-3xl -z-10"></div>
        </div>
      </section>
      <section className="px-6 flex justify-center pt-12 pb-32">
        <div className="max-w-4xl w-full text-center p-16 rounded-3xl shadow-neomorph-raised bg-surface-container overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-3xl font-extrabold text-on-surface mb-8">
              Ready to get started?
            </h2>
            <button 
              onClick={() => router.push("/generate")}
              className="inline-flex items-center gap-3 px-8 py-3 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300 active:scale-95">
              Start Generating
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
