"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, Mail, Lock, User, UserPlus, Scale, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })
      
      if (error) throw error
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-legal-xl border-primary-100 animate-fade-in bg-white/90 backdrop-blur-md text-center">
          <CardHeader className="pt-10">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-display font-bold">Compte créé !</CardTitle>
            <CardDescription className="text-lg">
              Un email de confirmation a été envoyé à <span className="font-semibold text-foreground">{formData.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-8">
              Veuillez cliquer sur le lien dans l'email pour activer votre accès sécurisé à JuriPlateforme.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full btn-primary h-12 text-lg">
                Retour à la connexion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary to-primary p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-20 right-10 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-40 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10">
          <Link href="/landing" className="inline-flex items-center text-white/80 hover:text-white mb-12 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-legal-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <Scale className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight">JuriPlateforme</span>
          </div>
          <h2 className="text-5xl font-display font-bold leading-tight mb-6">
            Prenez le <span className="text-secondary-200">contrôle</span> de vos démarches
          </h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-lg text-white/80 leading-snug pt-1">
                Conformité totale avec la Loi 25 du Québec sur la vie privée.
              </p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-lg text-white/80 leading-snug pt-1">
                Assistant IA gratuit pour répondre à vos interrogations 24/7.
              </p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 p-6 bg-white/10 backdrop-blur-md rounded-legal-xl border border-white/20 max-w-md">
          <p className="text-sm italic text-white/90">
            "Une solution innovante qui simplifie l'accès à la justice pour toutes les familles québécoises."
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
              <CardTitle className="text-3xl font-display font-bold">Inscription</CardTitle>
              <CardDescription>Rejoignez la plateforme juridique 100% gratuite</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-legal text-sm font-medium">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" name="fullName" placeholder="Jean Tremblay" value={formData.fullName} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="nom@exemple.com" value={formData.email} onChange={handleChange} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="pl-10" required />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">
                    Minimum 8 caractères, incluant majuscules et chiffres.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full btn-primary text-lg h-12 shadow-md" disabled={loading}>
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><UserPlus className="mr-2 h-5 w-5" /> Créer mon compte</>}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Déjà un compte ?{' '}
                  <Link href="/auth/signin" className="text-primary font-bold hover:underline">
                    Se connecter
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
          
          <p className="mt-6 text-center text-[10px] text-muted-foreground px-6">
            En vous inscrivant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité conforme à la Loi 25.
          </p>
        </div>
      </div>
    </div>
  )
}
