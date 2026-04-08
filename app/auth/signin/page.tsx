"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, Mail, Lock, LogIn, Scale, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      if (error) throw error
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Erreur de connexion. Vérifiez vos identifiants.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10">
          <Link href="/landing" className="inline-flex items-center text-white/80 hover:text-white mb-12 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-legal-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Scale className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight">JuriPlateforme</span>
          </div>
          <h2 className="text-5xl font-display font-bold leading-tight mb-6">
            Votre espace juridique <span className="text-primary-200">sécurisé</span>
          </h2>
          <p className="text-xl text-white/80 max-w-lg leading-relaxed">
            Accédez à vos dossiers, collaborez avec votre avocat et utilisez notre assistant IA spécialisé en droit familial québécois.
          </p>
        </div>
        
        <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-legal-xl border border-white/20 max-w-md">
          <div className="flex items-center space-x-3 mb-4 text-green-300">
            <Shield className="h-6 w-6" />
            <span className="font-semibold uppercase tracking-wider text-sm">Conforme Loi 25 Québec</span>
          </div>
          <p className="text-sm text-white/70">
            Le plus haut standard de sécurité pour vos données personnelles et documents juridiques sensibles.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-subtle">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="w-10 h-10 rounded-legal bg-legal-gradient flex items-center justify-center">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">JuriPlateforme</span>
          </div>

          <Card className="shadow-legal-xl border-border bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-display font-bold">Connexion</CardTitle>
              <CardDescription>Entrez vos identifiants pour accéder à votre compte</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-legal text-sm font-medium">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="nom@exemple.com" value={formData.email} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="#" className="text-xs text-primary hover:underline">Oublié ?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full btn-primary text-lg h-12 shadow-md" disabled={loading}>
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><LogIn className="mr-2 h-5 w-5" /> Se connecter</>}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Pas encore de compte ?{' '}
                  <Link href="/auth/signup" className="text-primary font-bold hover:underline">
                    Créer un compte gratuit
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
          
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-muted-foreground bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border text-xs">
              <Sparkles className="h-3 w-3 text-secondary" />
              <span>Version Alpha v1.0 • 100% Gratuit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
