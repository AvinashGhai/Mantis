"use client";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPresignedUploadUrl } from "@/app/actions/s3";
import { 
  Users, Activity, AlertTriangle, FileText, Database, 
  Upload, Link as LinkIcon, Video, CheckCircle2, Loader2, Globe, Cpu, Plus, WashingMachine
} from "lucide-react";

export function CompanyDashboard() {
  // --- STATE ---
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Appliance");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName) return alert("Please enter a product name.");
    if (!selectedFile && !externalUrl) return alert("Provide training data (File or URL).");

    // 1. Map to backend-compatible IDs: 'ac', 'washing_machine', 'monitor'
    const getBackendId = () => {
        const name = productName.toLowerCase();
        if (name.includes("ac") || name.includes("air")) return "ac";
        if (name.includes("wash")) return "washing_machine";
        return "monitor"; // Default fallback
    };

    const productId = getBackendId();
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      let finalDataLocation = externalUrl;

      // STEP 1: HIT LOCAL FASTAPI FOR MODEL TRAINING (PDF Ingestion)
      if (selectedFile && selectedFile.type === "application/pdf") {
        console.log(`🚀 Sending PDF to FastAPI for product: ${productId}`);
        
        const formData = new FormData();
        formData.append("file", selectedFile); // Backend expects key 'file'

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const fastApiResponse = await fetch(`${apiBase}/ingest/pdf/${productId}`, {
          method: "POST",
          body: formData,
        });

        if (!fastApiResponse.ok) throw new Error("FastAPI training failed");
        console.log("✅ FastAPI Ingestion Complete");
      }

      // STEP 2: UPLOAD TO AWS S3 (For storage/reference)
      if (selectedFile) {
        const { url, fileKey } = await getPresignedUploadUrl(selectedFile.name, selectedFile.type, "company");
        await fetch(url, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": selectedFile.type },
        });
        finalDataLocation = `s3://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}/${fileKey}`;
      }

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const creatorEmail = user ? user.email : "anonymous@company.com";

      // STEP 3: REGISTER IN MONGODB (Marketplace Listing)
      const addRes = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          category: category,
          brand: user?.name || "Mantis",
          source_url: finalDataLocation,
          product_id: productId, // Link to backend ID
          icon: productId === "ac" ? "Wind" : productId === "washing_machine" ? "WashingMachine" : "Cpu",
          creatorEmail: creatorEmail
        }),
      });

      const addData = await addRes.json();
      if (!addData.success) {
        throw new Error(addData.error || "Failed to register product");
      }

      // UI SUCCESS STATE
      setUploadSuccess(true);
      setProductName("");
      setSelectedFile(null);
      setExternalUrl("");
      setTimeout(() => setUploadSuccess(false), 3000);

    } catch (error: any) {
      console.error("Pipeline Error:", error);
      alert(`Error: ${error.message}. Ensure FastAPI is running on port 8000.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto bg-canvas">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-2/40 p-6 rounded-3xl border border-line">
        <div>
            <h1 className="text-3xl font-display font-bold text-text tracking-tight">Manufacturer HQ</h1>
            <p className="text-text-muted text-sm mt-1 uppercase font-mono tracking-widest opacity-60">Status: Mantis_Primary_Admin</p>
        </div>
        <Badge variant="outline" className="border-confirm/20 text-confirm bg-confirm/5 font-mono px-4 py-1.5 h-fit">
            <Activity size={14} className="mr-2 animate-pulse"/> AI_ENGINE_LOCAL_PORT_8000
        </Badge>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard title="Listed Units" value="1,284" icon={<Users size={16}/>} />
        <AnalyticsCard title="Model Sync" value="98.1%" icon={<Activity className="text-confirm" size={16}/>} />
        <AnalyticsCard title="Escalations" value="04" icon={<AlertTriangle className="text-alert" size={16}/>} />
        <AnalyticsCard title="Total Knowledge" value="14.2GB" icon={<Database size={16}/>} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 pb-12">
        
        {/* DYNAMIC REGISTRATION FORM */}
        <Card className="lg:col-span-2 bg-surface border-line shadow-2xl">
          <CardHeader className="border-b border-line bg-surface-2/30">
            <CardTitle className="text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2">
              <Plus size={14} className="text-confirm" /> Train_New_Product_Model
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleIngest} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-text-muted">Product Identity (Display Name)</label>
                  <Input 
                    placeholder="e.g. Arctic v2 AC" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="h-12 bg-surface-2 border-line rounded-xl focus:ring-confirm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-text-muted">Industry Hub</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-2 border border-line rounded-xl h-12 px-4 text-sm focus:ring-1 focus:ring-confirm outline-none"
                  >
                    <option>Appliance</option>
                    <option>EV / Scooter</option>
                    <option>Industrial Electronics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* S3 & FASTAPI DROP ZONE */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                    selectedFile ? "border-confirm bg-confirm/5" : "border-line bg-canvas/30 hover:border-confirm/40"
                  }`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                  {selectedFile ? (
                    <div className="text-center">
                        <CheckCircle2 size={40} className="text-confirm mx-auto mb-3" />
                        <p className="text-sm font-bold truncate max-w-[200px] text-text">{selectedFile.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-[10px] text-alert mt-4 uppercase font-bold hover:underline">Clear File</button>
                    </div>
                  ) : (
                    <>
                        <Upload size={40} className="text-text-faint group-hover:text-confirm transition-colors mb-3" />
                        <p className="text-sm font-bold text-text">Upload PDF Manual</p>
                        <p className="text-[10px] text-text-faint mt-1 uppercase font-mono tracking-widest">Triggers Model Training</p>
                    </>
                  )}
                </div>

                {/* URL INPUT */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase text-text-muted italic">Or provide web link</label>
                    <div className="relative">
                        <Globe size={14} className="absolute left-4 top-4 text-text-faint" />
                        <Input 
                            placeholder="https://manuals.mantis.com/..." 
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            className="pl-12 bg-surface-2 border-line h-12 rounded-xl" 
                        />
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-confirm/5 border border-confirm/10 flex gap-4">
                    <Database size={20} className="text-confirm shrink-0" />
                    <p className="text-[11px] text-confirm/80 leading-relaxed font-medium">
                      Initializing registration will synchronize the RAG pipeline with your local model. Product becomes discoverable instantly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-line flex items-center justify-between">
                <p className="text-[10px] text-text-faint font-mono uppercase tracking-widest italic decoration-confirm/30">Localhost:8000 Connectivity: Online</p>
                <Button 
                    type="submit" 
                    disabled={isUploading || (!selectedFile && !externalUrl)}
                    className="bg-confirm text-canvas font-bold px-12 h-14 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-confirm/20"
                >
                  {isUploading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Training_AI...</> : 
                   uploadSuccess ? <><CheckCircle2 className="mr-2 h-5 w-5" /> Model_Ready</> : 
                   "Start Model Training"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* MONITORING SIDEBAR */}
        <div className="space-y-6">
            <Card className="bg-surface border-line overflow-hidden shadow-lg border-t-4 border-t-confirm">
                <CardContent className="pt-8 pb-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono text-text-muted">
                                <span>RAG_CHUNKING_NODES</span>
                                <span className="text-confirm">82.4%</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                                <div className="h-full bg-confirm w-[82%]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <StatBoxSmall label="Active Index" val="4,209" />
                            <StatBoxSmall label="Port Status" val="8000" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-surface border-line">
                <CardHeader>
                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">Ingestion_Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-4">
                            <AssetItem name="Mantis_AC_Guide.pdf" status="Synced" />
                            <AssetItem name="Wash_Repair_V1.pdf" status="Trained" />
                            <AssetItem name="Monitor_Datasheet" status="Indexed" />
                            <AssetItem name="Circuit_Logic.png" status="Ready" />
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function AssetItem({ name, status }: { name: string, status: string }) {
    return (
        <div className="flex items-center justify-between p-3.5 bg-surface-2/50 border border-line rounded-xl hover:border-confirm/40 transition-colors">
            <div className="flex items-center gap-3">
                <FileText size={14} className="text-text-faint" />
                <span className="text-xs font-bold truncate w-24 text-text">{name}</span>
            </div>
            <span className="text-[9px] font-mono text-confirm bg-confirm/5 px-2 py-0.5 rounded border border-confirm/10">{status}</span>
        </div>
    )
}

function StatBoxSmall({ label, val }: any) {
    return (
        <div className="text-center p-3 rounded-2xl bg-canvas/40 border border-line">
            <p className="text-[9px] text-text-faint uppercase font-bold mb-1">{label}</p>
            <p className="text-lg font-bold font-mono text-text">{val}</p>
        </div>
    )
}

function AnalyticsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-surface border-line p-6 hover:shadow-xl hover:shadow-confirm/5 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-text-muted font-mono uppercase tracking-[0.2em]">{title}</p>
        <div className="text-confirm/40">{icon}</div>
      </div>
      <p className="text-3xl font-bold font-display mt-4 tracking-tighter">{value}</p>
    </Card>
  );
}