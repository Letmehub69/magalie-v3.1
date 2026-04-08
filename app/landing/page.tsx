"use client"

import Link from 'next/link'
import { 
  Scale, Shield, Brain, Users, ArrowRight, CheckCircle2, MessageSquare, 
  Lock, Zap, Heart, Star, Sparkles, HelpCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const features = [
    {
      title: "Assistant IA Juridique",
      description: "Des réponses instantanées basées sur le Code civil du Québec.",
      icon: <Brain className="h-6 w-6 text-primary" />,
      color: "bg-blue-50"
    },
    {
      title: "Sécurité Loi 25",
      description: "Chiffrement AES-256 de bout en bout pour vos documents sensibles.",
      icon: <Shield className="h-6 w-6 text-accent" />,
      color: "bg-accent-50"
    },
    {
      title: "Collaboration Avocat",
      description: "Partagez votre dossier avec votre conseiller en toute sécurité.",
      icon: <Users className="h-6 w-6 text-secondary" />,
      color: "bg-purple-50"
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-legal bg-legal-gradient flex items-center justify-center">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">JuriPlateforme</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Fonctionnalités</Link>
            <Link href="#security" className="text-sm font-medium hover:text-primary transition-colors">Sécurité</Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="rounded-legal">Connexion</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="btn-primary rounded-legal">S'inscrire gratuitement</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary px-4 py-2 rounded-full text-sm font-bold mb-8 animate-fade-in shadow-sm border border-primary-100">
            <Sparkles className="h-4 w-4" />
            <span>La plateforme juridique #1 pour les familles du Québec</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground mb-6 leading-tight">
            Le droit familial, <br />
            <span className="text-legal-gradient">enfin simple et gratuit</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Obtenez des conseils IA, gérez vos documents et collaborez avec vos experts sur une plateforme 100% sécurisée et conforme à la Loi 25.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="btn-primary w-full sm:w-auto px-10 h-14 text-lg rounded-legal-xl shadow-legal">
                Démarrer mon dossier gratuit
              </Button>
            </Link>
            <Link href="/dashboard/ai" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 h-14 text-lg rounded-legal-xl bg-white/50 backdrop-blur-sm border-2">
                Essayer l'assistant IA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Une solution complète pour vos démarches</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Tout ce dont vous avez besoin pour naviguer le système juridique québécois en toute sérénité.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-legal-xl border border-border shadow-sm hover:shadow-legal transition-all hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-legal ${feature.color} flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Gratuit pour toujours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">AES-256</div>
              <div className="text-sm text-muted-foreground">Chiffrement militaire</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">Loi 25</div>
              <div className="text-sm text-muted-foreground">Conformité totale</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support IA inclus</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Scale className="h-6 w-6 text-primary-200" />
              <span className="text-xl font-display font-bold">JuriPlateforme</span>
            </div>
            <p className="text-white/60 leading-relaxed">Démocratiser l'accès à la justice au Québec grâce à l'IA et une technologie sécurisée.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Plateforme</h4>
            <ul className="space-y-3 text-white/60">
              <li><Link href="#" className="hover:text-white transition-colors">Dossiers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Assistant IA</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sécurité</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Contact</h4>
            <p className="text-white/60 mb-4">Besoin d'aide ou envie de contribuer ?</p>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-legal">
              Contactez-nous
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          © 2026 JuriPlateforme. Fait avec ❤️ au Québec.
        </div>
      </footer>
    </div>
  )
}
