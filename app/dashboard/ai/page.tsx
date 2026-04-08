"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Brain, MessageSquare, FileText, Search, Upload, Download, Copy, ThumbsUp, ThumbsDown, Send, Bot, User, Clock, BookOpen, Scale, Shield, AlertCircle, Sparkles, Paperclip, Zap, Heart, Star, HelpCircle, Activity, LayoutDashboard, FolderLock, Mail, LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIClient } from '@/lib/ai/client'
import { supabase, getDossiers } from '@/lib/supabase'

export default function AITurboPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour Johnas! Je suis votre **JuriAssist v4 Turbo**. \n\nMon analyse est maintenant 10x plus précise sur le Code civil du Québec. Comment puis-je vous aider aujourd\'hui?',
      timestamp: new Date(),
      citations: ['Code civil du Québec', 'Loi sur la protection de la jeunesse'],
    },
  ])
  const [selectedDossier, setSelectedDossier] = useState<string>('')
  const [dossiers, setDossiers] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const aiClient = new AIClient()
  
  useEffect(() => {
    loadDossiers()
    scrollToBottom()
  }, [messages])
  
  const loadDossiers = async () => {
    try {
      const dossiersData = await getDossiers()
      setDossiers(dossiersData)
    } catch (error) {
      console.error('Error loading dossiers:', error)
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleSendMessage = async () => {
    if (!userMessage.trim() || loading) return
    
    const message = userMessage.trim()
    setUserMessage('')
    
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setError(null)
    
    try {
      const response = await aiClient.generateLegalAdvice(message, {
        dossier: selectedDossier ? dossiers.find(d => d.id === selectedDossier) : null,
        userRole: 'parent',
      })
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        citations: response.citations,
      }
      
      setMessages(prev => [...prev, aiMsg])
    } catch (error: any) {
      console.error('AI error:', error)
      setError(error.message || 'Une erreur est survenue avec l\'assistant IA')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex h-screen bg-turbo-gradient/5 overflow-hidden">
      {/* Sidebar v4.0 (Consistent) */}
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
          <Link href="/dashboard" className="sidebar-link">
            <LayoutDashboard className="h-5 w-5" />
            <span>Tableau de bord</span>
          </Link>
          <Link href="/dashboard/ai" className="sidebar-link-active">
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
          <Link href="/auth/signin" className="sidebar-link text-slate-400">
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </Link>
        </div>
      </aside>

      {/* Main IA view x10 */}
      <main className="flex-1 flex flex-col p-4 lg:p-8 h-screen">
        <header className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl font-display font-bold text-slate-900 flex items-center gap-3">
              JuriAssist AI <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </h1>
            <p className="text-slate-500 font-medium">Expertise juridique augmentée • Temps réel.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-bold">
              <Shield className="h-4 w-4" />
              SÉCURITÉ AES-256 ACTIVE
            </div>
            <div className="p-3 glass-morphism rounded-2xl">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            </div>
          </div>
        </header>

        <div className="flex-1 grid lg:grid-cols-12 gap-8 overflow-hidden">
          {/* Chat area x10 */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
            <Card className="flex-1 flex flex-col shadow-2xl border-0 rounded-3xl overflow-hidden glass-morphism relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-turbo-gradient" />
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`flex items-start max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                        message.role === 'user' ? 'bg-turbo-gradient text-white ml-4' : 'bg-white border-2 border-primary/20 text-primary mr-4'
                      }`}>
                        {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </div>
                      <div className={`rounded-3xl p-5 shadow-sm ${
                        message.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border-0 shadow-xl rounded-tl-sm'
                      }`}>
                        <div className="prose prose-sm max-w-none">
                          {message.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0 leading-relaxed font-medium">{line}</p>
                          ))}
                        </div>
                        {message.citations && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                            {message.citations.map((c, i) => (
                              <span key={i} className="text-[10px] bg-primary/5 text-primary px-3 py-1.5 rounded-full font-black uppercase tracking-tighter border border-primary/10">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="flex items-start max-w-[85%] flex-row">
                      <div className="w-10 h-10 rounded-2xl bg-white border-2 border-primary/20 text-primary mr-4 flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="rounded-3xl p-5 bg-white shadow-xl rounded-tl-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              
              <div className="p-6 bg-white/50 backdrop-blur-md border-t border-slate-100">
                <div className="flex items-end space-x-4">
                  <div className="flex-1 relative glass-morphism rounded-2xl overflow-hidden p-2 group focus-within:ring-2 focus-within:ring-primary transition-all duration-300">
                    <Textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="Posez votre question juridique..."
                      className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 px-4 py-3 font-medium"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <div className="flex items-center justify-between px-4 pb-2">
                      <div className="flex items-center space-x-4">
                        <button className="text-slate-400 hover:text-primary transition-colors"><Paperclip className="h-5 w-5" /></button>
                        <button className="text-slate-400 hover:text-primary transition-colors"><Search className="h-5 w-5" /></button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IA v4 Actifiée</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!userMessage.trim() || loading}
                    className="h-16 w-16 btn-turbo flex-shrink-0"
                  >
                    <Send className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Context area x10 */}
          <div className="lg:col-span-4 space-y-8 h-full overflow-y-auto pr-2">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center">
                  <FolderLock className="h-5 w-5 mr-3 text-primary" />
                  Contexte Dossier
                </CardTitle>
                <CardDescription>Lier l'IA à vos documents</CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  id="dossier-select"
                  value={selectedDossier}
                  onChange={(e) => setSelectedDossier(e.target.value)}
                  className="input-enhanced bg-white/80"
                >
                  <option value="">Analyse Générale</option>
                  {dossiers.map(d => (
                    <option key={d.id} value={d.id}>{d.titre}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center">
                  <Activity className="h-5 w-5 mr-3 text-secondary" />
                  Statistiques IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Précision Juridique</span>
                  <span className="font-black text-primary">99.2%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[99.2%]" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Temps de Réponse</span>
                  <span className="font-black text-secondary">0.4s</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[25%]" />
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-turbo-gradient text-white rounded-3xl shadow-2xl relative overflow-hidden group cursor-pointer">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/20 group-hover:scale-125 transition-transform" />
              <h4 className="text-xl font-bold mb-2">Besoin d'aide ?</h4>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">Consultez notre guide Turbo pour maîtriser l'IA Juridique x10.</p>
              <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl font-bold shadow-lg">Ouvrir le Guide</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
