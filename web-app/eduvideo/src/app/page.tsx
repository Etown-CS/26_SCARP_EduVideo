import Image from "next/image";

export default function Home() {
  return (
    <section className="relative pt-20 pb-32 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-on-surface leading-tight tracking-tight mb-8">
          Welcome to <br/>
          <span className="text-primary">BluEdu</span>
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-16 leading-relaxed">
            BluEdu turns your Computer Science materials into informational videos. <a className="text-primary" href="/sign-in">Sign in</a> or <a className="text-primary" href="/sign-up">create an account</a> to get started.
        </p>
      </div>
    </section>
  );
}
