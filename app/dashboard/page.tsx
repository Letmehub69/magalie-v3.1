"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FileText, Brain, Users, Calendar, PlusCircle, Search, Clock, 
  Settings, LogOut, LayoutDashboard, ChevronRight, Activity, Shield,
  ArrowUpRight, Sparkles, FolderLock, Mail, Bell, Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDossiers } from '@/lib/supabase'

export default function DashboardTurboPage() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getDossiers()
      setDossiers(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex h-screen bg-turbo-gradient/5 overflow-hidden">
      {/* Sidebar v4.0 */}
      <aside className="hidden lg:flex flex-col w-72 m-4 glass-morphism rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-12 h-12 rounded-2xl bg-turbo-gradient flex items-center justify-center shadow-lg">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight">JuriPlateforme</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Version Turbo x10</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          <Link href="/dashboard" className="sidebar-link-active">
            <LayoutDashboard className="h-5 w-5" />
            <span>Tableau de bord</span>
          </Link>
          <Link href="/dashboard/ai" className="sidebar-link">
            <Brain className="h-5 w-5" />
            <span>Assistant IA v4</span>
          </Link>
          <Link href="/dashboard/dossiers/new" className="sidebar-link">
            <FolderLock className="h-5 w-5" />
            <span>Dossiers Privés</span>
          </Link>
          <Link href="/dashboard/messages" className="sidebar-link">
            <Mail className="h-5 w-5" />
            <span>Messagerie</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200">
          <div className="bg-primary/5 p-4 rounded-2xl mb-4 text-center">
            <p className="text-xs text-primary font-bold mb-1">Stockage Sécurisé</p>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[12%]" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">1.2 GB / 10 GB utilisés</p>
          </div>
          <Link href="/auth/signin" className="sidebar-link text-slate-400">
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </Link>
        </div>
      </aside>

      {/* Main Turbo View */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex items-center justify-between mb-10">
          <div className="flex flex-col">
            <h1 className="text-4xl font-display font-bold text-slate-900 flex items-center gap-3">
              Bonjour, Johnas <Sparkles className="h-6 w-6 text-yellow-500" />
            </h1>
            <p className="text-slate-500 font-medium">Le portail juridique le plus rapide du Québec.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 glass-morphism rounded-2xl relative cursor-pointer">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-primary/20 p-1 flex items-center justify-center overflow-hidden shadow-sm">
              <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-primary font-bold">J</div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-10 animate-slide-up">
          {/* Dashboard Cards x10 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card">
              <CardContent className="pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-blue-500/10 rounded-2xl">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-4xl font-bold font-display">{dossiers.length}</div>
                <div className="mt-2 text-sm text-slate-500 font-medium uppercase tracking-wider">Dossiers Actifs</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-purple-500/10 rounded-2xl">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-4xl font-bold font-display">Turbo</div>
                <div className="mt-2 text-sm text-slate-500 font-medium uppercase tracking-wider">Mode IA Activé</div>
              </CardContent>
            </Card>
            <Card className="glass-card col-span-1 md:col-span-2 bg-turbo-gradient text-white">
              <CardContent className="pt-8 relative overflow-hidden">
                <Shield className="absolute -right-10 -bottom-10 h-48 w-48 text-white/10" />
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-bold uppercase tracking-widest text-xs">Sécurité Loi 25 Certifiée</span>
                  </div>
                  <h3 className="text-2xl font-bold font-display mb-4 leading-tight">Chiffrement AES-256 Actif<br />sur 100% de vos documents.</h3>
                  <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl shadow-xl font-bold">Vérifier la Protection</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dossiers Grid x10 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-display">Dossiers Récents</h2>
              <Link href="/dashboard/dossiers/new">
                <Button className="btn-turbo">
                  <PlusCircle className="h-5 w-5" />
                  Nouveau Dossier
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold">Accélération x10 en cours...</p>
              </div>
            ) : dossiers.length === 0 ? (
              <Card className="glass-morphism border-dashed border-2 py-24 text-center">
                <CardContent>
                  <FolderLock className="h-20 w-20 text-slate-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-2">Aucun dossier trouvé</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">Commencez par créer votre premier dossier sécurisé pour débloquer toutes les fonctionnalités.</p>
                  <Link href="/dashboard/dossiers/new">
                    <Button variant="outline" className="rounded-2xl h-12 px-8">Créer mon premier dossier</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dossiers.map((dossier) => (
                  <Card key={dossier.id} className="glass-card group overflow-hidden border-0 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-turbo-gradient" />
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase font-black tracking-tighter">
                          {dossier.dossier_number}
                        </span>
                        <div className="h-3 w-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      </div>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors mb-2">{dossier.titre}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed">{dossier.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center text-[10px] font-bold">AV</div>
                        <span className="text-xs text-slate-500 font-medium">Maître Tremblay</span>
                      </div>
                      <Link href={`/dashboard/dossiers/${dossier.id}`}>
                        <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-primary hover:text-white transition-all">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
