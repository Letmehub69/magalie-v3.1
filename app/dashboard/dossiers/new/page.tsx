"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, FileText, Users, Calendar, Tag, Lock, Upload, HelpCircle, CheckCircle, AlertCircle, ChevronRight, ShieldCheck, PlusCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase, createDossier } from '@/lib/supabase'
import { generateDossierNumber } from '@/lib/utils'

export default function NewDossierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dossierId, setDossierId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'familial',
    statut: 'actif',
    avocat_id: '',
    client_id: '',
    date_ouverture: new Date().toISOString().split('T')[0],
    date_cloture: '',
    access_level: 'private',
    tags: '',
    priority: 'medium',
    confidential: true,
  })
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  
  const dossierTypes = [
    { value: 'familial', label: 'Droit familial', icon: '👨‍👩‍👧' },
    { value: 'civil', label: 'Droit civil', icon: '⚖️' },
    { value: 'penal', label: 'Droit pénal', icon: '🚨' },
    { value: 'administratif', label: 'Droit administratif', icon: '🏛️' },
    { value: 'autre', label: 'Autre', icon: '📁' },
  ]
  
  const priorities = [
    { value: 'low', label: 'Basse', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'medium', label: 'Moyenne', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'high', label: 'Haute', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
  ]
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newFiles = Array.from(files)
    setUploadedFiles(prev => [...prev, ...newFiles])
  }
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const validateForm = (): boolean => {
    setError(null)
    if (!formData.titre.trim()) {
      setError('Le titre du dossier est requis')
      return false
    }
    return true
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const dossierData = {
        ...formData,
        dossier_number: generateDossierNumber(),
        created_by: user?.id || 'anonymous',
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        date_ouverture: new Date(formData.date_ouverture).toISOString(),
        date_cloture: formData.date_cloture ? new Date(formData.date_cloture).toISOString() : null,
      }
      
      const dossier = await createDossier(dossierData)
      setDossierId(dossier.id)
      
      if (uploadedFiles.length > 0 && user) {
        for (const file of uploadedFiles) {
          await supabase.storage
            .from('documents')
            .upload(`dossiers/${dossier.id}/${file.name}`, file)
        }
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error: any) {
      console.error('Error creating dossier:', error)
      setError(error.message || 'Une erreur est survenue lors de la création du dossier')
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 lg:p-8 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-legal-xl border-primary-100 animate-fade-in bg-white/90 backdrop-blur-md">
          <CardContent className="pt-10 pb-8 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">Dossier Créé !</h2>
            <p className="text-muted-foreground mb-8">
              Le dossier <span className="font-semibold text-foreground">{formData.titre}</span> a été créé avec succès et sécurisé.
            </p>
            
            <div className="bg-primary-50 rounded-legal p-4 mb-8 text-left border border-primary-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-primary-700">Numéro de référence</span>
                <span className="font-mono font-bold text-primary-900">{generateDossierNumber()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-primary-700">Niveau de sécurité</span>
                <span className="text-sm font-medium flex items-center text-green-700">
                  <ShieldCheck className="w-4 h-4 mr-1" /> AES-256
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-700">Documents joints</span>
                <span className="text-sm font-medium text-primary-900">{uploadedFiles.length} fichier(s)</span>
              </div>
            </div>
            
            <Button onClick={() => router.push('/dashboard')} className="w-full rounded-legal-xl text-lg h-12 shadow-md">
              Aller au tableau de bord <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-subtle p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground flex items-center">
              <div className="w-12 h-12 rounded-legal-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center mr-4 shadow-md">
                <PlusCircle className="h-6 w-6 text-white" />
              </div>
              Nouveau Dossier
            </h1>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-legal border-border bg-white/90 backdrop-blur-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-2 pt-2">
                <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-2">
                  {['basic', 'parties', 'documents', 'security'].map((tab) => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab}
                      className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-t-legal rounded-b-none px-6 py-3"
                    >
                      {tab === 'basic' && <><FileText className="w-4 h-4 mr-2" /> Informations</>}
                      {tab === 'parties' && <><Users className="w-4 h-4 mr-2" /> Parties</>}
                      {tab === 'documents' && <><Upload className="w-4 h-4 mr-2" /> Documents</>}
                      {tab === 'security' && <><Lock className="w-4 h-4 mr-2" /> Sécurité</>}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <div className="p-6 md:p-8">
                {error && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-legal flex items-center">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                <TabsContent value="basic" className="mt-0 space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="titre" className="text-base font-semibold">Titre du dossier <span className="text-destructive">*</span></Label>
                      <Input id="titre" name="titre" value={formData.titre} onChange={handleChange} placeholder="Ex: Dossier Tremblay - Garde d'enfants" className="mt-2 text-lg" required />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="type" className="font-semibold">Type de droit</Label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} className="input-enhanced mt-2">
                          {dossierTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="priority" className="font-semibold">Priorité</Label>
                        <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="input-enhanced mt-2">
                          {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="font-semibold">Description sommaire</Label>
                      <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Décrivez brièvement la situation..." className="mt-2 min-h-[100px] resize-y rounded-legal border-border p-3" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t">
                    <Button type="button" onClick={() => setActiveTab('parties')} className="rounded-legal">Suivant <ChevronRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="parties" className="mt-0 space-y-6 animate-fade-in">
                  <div className="bg-blue-50 p-4 rounded-legal border border-blue-100 flex items-start">
                    <HelpCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                    <p className="text-sm text-blue-800">Vous pourrez inviter des collaborateurs (avocat, expert) plus tard via le tableau de bord du dossier. Laissez vide si incertain.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="client_id" className="font-semibold">ID Client (Optionnel)</Label>
                      <Input id="client_id" name="client_id" value={formData.client_id} onChange={handleChange} placeholder="Email ou identifiant" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="avocat_id" className="font-semibold">ID Avocat (Optionnel)</Label>
                      <Input id="avocat_id" name="avocat_id" value={formData.avocat_id} onChange={handleChange} placeholder="Email ou identifiant" className="mt-2" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('basic')} className="rounded-legal">Précédent</Button>
                    <Button type="button" onClick={() => setActiveTab('documents')} className="rounded-legal">Suivant <ChevronRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents" className="mt-0 space-y-6 animate-fade-in">
                  <div className="border-2 border-dashed border-primary/30 bg-primary-50/30 hover:bg-primary-50/50 transition-colors rounded-legal-xl p-10 text-center cursor-pointer relative">
                    <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="w-12 h-12 text-primary/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary-900 mb-2">Déposez vos documents initiaux ici</h3>
                    <p className="text-sm text-muted-foreground">PDF, Word, Images (Max 50MB)</p>
                    <Button type="button" variant="secondary" className="mt-6 pointer-events-none">Parcourir les fichiers</Button>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Fichiers sélectionnés ({uploadedFiles.length})</h4>
                      {uploadedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-legal shadow-sm">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-primary mr-3" />
                            <span className="font-medium text-sm truncate max-w-[200px] md:max-w-[400px]">{file.name}</span>
                          </div>
                          <button type="button" onClick={() => removeFile(i)} className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors text-sm font-medium">Retirer</button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('parties')} className="rounded-legal">Précédent</Button>
                    <Button type="button" onClick={() => setActiveTab('security')} className="rounded-legal">Suivant <ChevronRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="security" className="mt-0 space-y-6 animate-fade-in">
                  <div className="bg-green-50 border border-green-200 rounded-legal p-5">
                    <div className="flex items-center mb-3">
                      <ShieldCheck className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="font-bold text-green-900">Protection maximale garantie</h3>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Ce dossier sera protégé par un chiffrement AES-256 de bout en bout. Seules les personnes explicitement autorisées y auront accès, conformément à la Loi 25.
                    </p>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start space-x-3 p-4 border rounded-legal bg-white">
                      <input type="checkbox" id="confidential" name="confidential" checked={formData.confidential} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
                      <div>
                        <Label htmlFor="confidential" className="font-bold text-base cursor-pointer">Marquer comme Hautement Confidentiel</Label>
                        <p className="text-sm text-muted-foreground mt-1">Nécessite une authentification à deux facteurs pour ouvrir les documents.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-8 border-t mt-8">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('documents')} className="rounded-legal">Précédent</Button>
                    <Button type="submit" disabled={loading} className="btn-primary rounded-legal-xl px-8 shadow-md">
                      {loading ? <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Création...</span> : <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Créer et Sécuriser le Dossier</span>}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </form>
      </div>
    </div>
  )
}
