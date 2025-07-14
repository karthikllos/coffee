import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-[100vh] bg-slate-950 text-white flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* 🌌 Background Glow & Grid */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,#0f172a_0%,#020617_100%)]" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f22_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f22_1px,transparent_1px)] bg-[size:14px_24px] opacity-10" />

      {/* 🚀 Hero Section */}
      <div className="relative z-10 text-center max-w-3xl space-y-6 mt-16">
        <h1 className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-violet-600 animate-pulse drop-shadow-lg flex items-center justify-center gap-4">
          Buy Me A Chai
          <img
            src="https://i0.wp.com/boingboing.net/wp-content/uploads/2016/12/decorate-1.gif?resize=370%2C172&ssl=1"
            alt="chai gif"
            className="w-[5rem] h-[5rem] sm:w-[6.5rem] sm:h-[6.5rem] rounded-md shadow-lg"
          />
        </h1>

        <p className="text-lg text-gray-300 font-light">
          A crowdfunding platform for creators. Get funded by your fans and followers. Start now!
        </p>

        {/* 🎯 CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-blue-500 hover:to-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition">
            🚀 Start Here
          </button>
          <button className="bg-gradient-to-r from-pink-600 to-orange-500 hover:from-orange-500 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition">
            📚 Read More
          </button>
        </div>
      </div>
            <div className="bg-red"> Get Me a Coffee</div>

      {/* 🌠 Features Section */}
      <section className="relative z-10 mt-24 grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-6xl w-full">
        {[
          {
            img: "https://assets-v2.lottiefiles.com/a/4bac5fc2-1167-11ee-8a4a-1779c9fbd7bf/Cpx8JAjE84.gif",
            title: "Turn Ideas into Income",
            desc: "Your creativity deserves a platform. Monetize effortlessly with chai-powered support.",
          },
          {
            img: "https://i.pinimg.com/originals/63/89/fa/6389fa22ed7653c40570c98b03764afc.gif",
            title: "Get Discovered Globally",
            desc: "Put your work in front of the world. Let your fans fund your journey from anywhere.",
          },
          {
            img: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
            title: "Build Your Community",
            desc: "Turn passive followers into active supporters and grow a loyal tribe.",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center space-y-4 bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl shadow-lg transition-transform hover:scale-105 duration-300"
          >
            <img
              src={card.img}
              className="rounded-full w-[96px] h-[96px] bg-slate-400 p-1 object-cover"
              alt={card.title}
            />
            <h3 className="text-xl font-bold text-white">{card.title}</h3>
            <p className="text-sm text-gray-300">{card.desc}</p>
          </div>
        ))}
      </section>


      {/* ☕ Floating Logo */}
      <div className="absolute bottom-6 right-8 opacity-30 animate-float">
        <Image src="/logo.png" alt="chai cup" width={80} height={80} />
      </div>
    </main>
  );
}
