import { useState } from 'react'

function Landing() {
  const [activeCase, setActiveCase] = useState(0)

  const caseStudies = [
    {
      title: 'DeFi Trading',
      description: 'Execute privacy-preserving trades with parallel execution achieving 10k-15k TPS.',
    },
    {
      title: 'Private Lending',
      description: 'Secure lending and borrowing with encrypted transactions.',
    },
    {
      title: 'Automation',
      description: 'Deploy automated strategies through our bot interface.',
    }
  ]

  const features = [
    {
      title: 'High Performance',
      description: '10,000-15,000 TPS with parallel execution',
    },
    {
      title: 'Complete Privacy',
      description: 'All transactions fully encrypted on-chain',
    },
    {
      title: 'No Gas Fees',
      description: 'Gasless transactions via EIP-191 signatures',
    },
    {
      title: 'Real-time Data',
      description: 'Oracle integration with Pyth Hermes API',
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
      {/* Navigation */}
      <nav className="fixed w-full bg-zinc-950/80 backdrop-blur-xl z-50 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Shadow Nox Logo" className="w-9 h-10" />
              <span className="text-lg font-semibold tracking-tight">Shadow Nox</span>
            </div>
            <div className="hidden md:flex items-center space-x-8 text-sm">
              <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
              <a href="#use-cases" className="text-zinc-400 hover:text-white transition-colors">Use cases</a>
              <a href="#faq" className="text-zinc-400 hover:text-white transition-colors">FAQ</a>
            </div>
            <div>
              <a href="https://t.me/shadownox42bot" target="_blank" rel="noopener noreferrer">
                <button className="px-5 py-2 bg-white text-zinc-950 rounded-lg text-sm hover:bg-zinc-100 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] font-medium">
                  Launch Bot
                </button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Privacy-first DeFi
              <br />
              <span className="text-zinc-500">on Arcology</span>
            </h1>
            <p className="text-zinc-400 text-xl mb-10 max-w-2xl mx-auto">
              Trade, lend, and earn with complete privacy. 10k-15k TPS. Zero gas fees.
            </p>
            <div className="flex justify-center space-x-4 mb-12">
              <a href="https://t.me/shadownox42bot" target="_blank" rel="noopener noreferrer">
                <button className="px-7 py-3 bg-white text-zinc-950 rounded-lg hover:bg-zinc-100 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] font-medium">
                  Launch Bot
                </button>
              </a>
              <a href="#faq">
                <button className="px-7 py-3 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  Documentation
                </button>
              </a>
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm text-zinc-500">
              <span>Arcology</span>
              <span>·</span>
              <span>Pyth Network</span>
              <span>·</span>
              <span>EVVM</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm transition-all hover:border-zinc-700/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <div className="text-3xl font-bold mb-1">15,247</div>
              <div className="text-sm text-zinc-500">Transactions/sec</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm transition-all hover:border-zinc-700/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <div className="text-3xl font-bold mb-1">$0</div>
              <div className="text-sm text-zinc-500">Gas fees</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm transition-all hover:border-zinc-700/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-sm text-zinc-500">Privacy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Built for performance
            </h2>
            <p className="text-zinc-400 text-lg">Enterprise-grade infrastructure</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6 hover:border-zinc-700/50 transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:bg-zinc-900/40">
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-6 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Use cases
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-8 hover:border-zinc-700/50 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.12)] hover:bg-zinc-900/60"
              >
                <h3 className="text-xl font-semibold mb-3">{study.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">{study.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="group">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 text-sm font-semibold group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                01
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Launch Telegram or WhatsApp bot. No wallet setup needed.
              </p>
            </div>
            <div className="group">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 text-sm font-semibold group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                02
              </div>
              <h3 className="text-lg font-semibold mb-2">Execute</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Send simple commands to trade, lend, or manage positions.
              </p>
            </div>
            <div className="group">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 text-sm font-semibold group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                03
              </div>
              <h3 className="text-lg font-semibold mb-2">Trade</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Instant settlement with complete privacy on Arcology.
              </p>
            </div>
          </div>
        </div>
      </section>





      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-zinc-900/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              FAQ
            </h2>
          </div>

          <div className="space-y-3">
            {[
              'What is Shadow Nox?',
              'How do I connect to the bot?',
              'Is my data private?',
              'What blockchains are supported?',
              'Are there any fees?'
            ].map((question, index) => (
              <div key={index} className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-5 hover:border-zinc-700/50 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-900/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{question}</span>
                  <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to start?
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            Experience private DeFi on Arcology
          </p>
          <a href="https://t.me/shadownox42bot" target="_blank" rel="noopener noreferrer">
            <button className="px-8 py-3 bg-white text-zinc-950 rounded-lg font-medium hover:bg-zinc-100 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
              Launch Bot
            </button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-zinc-500 mb-8">
              Questions? <a href="#" className="text-white hover:text-zinc-300 transition-colors">Contact us</a>
            </p>
            <div className="flex items-center justify-center space-x-6 mb-12">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="relative mb-12">
            <h1 className="text-7xl md:text-8xl font-black text-center tracking-tighter">
              <span className="text-zinc-900">Shadow Nox</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div className="text-center md:text-left">
              <h4 className="font-medium mb-2 text-zinc-400">Product</h4>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-medium mb-2 text-zinc-400">Resources</h4>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-medium mb-2 text-zinc-400">Company</h4>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-medium mb-2 text-zinc-400">Legal</h4>
            </div>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-zinc-800/50">
            <p className="text-zinc-600 text-sm">© 2025 Shadow Nox. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing