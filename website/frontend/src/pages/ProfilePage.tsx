import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Shield, Save } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  direcao: "Direção",
  professor: "Professor",
  encarregado: "Encarregado de Educação",
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
    }
  }, [user]);

  if (!user) return null;

  const initials = user.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put("/auth/profile", { nome, email });
      updateUser({ nome: response.data.nome, email: response.data.email });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerir informações da conta</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg shadow-card border border-border p-6 max-w-2xl"
      >
        <div className="flex items-center gap-5 mb-8">
          <Avatar className="h-20 w-20 text-xl">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{user.nome}</h2>
            <span className="inline-flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {roleLabels[user.tipo] || user.tipo}
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Nome
            </label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Perfil
            </label>
            <Input value={roleLabels[user.tipo] || user.tipo} disabled className="bg-muted" />
          </div>

          <div className="pt-4">
            <Button className="gap-2" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? "A gravar..." : "Guardar Alterações"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
