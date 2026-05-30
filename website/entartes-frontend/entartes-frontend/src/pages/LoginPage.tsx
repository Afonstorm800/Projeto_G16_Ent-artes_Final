import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = login(email, password);
    if (!success) {
      setError("Credenciais inválidas. Utilize um dos emails de teste.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-xl shadow-card border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Ent'Artes</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Sistema de Gestão de Artes Performativas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="email@exemplo.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Contas de teste (mockup):</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Direção:</span> admin@entartes.pt</p>
              <p><span className="font-medium text-foreground">Professor:</span> professor@entartes.pt</p>
              <p><span className="font-medium text-foreground">Encarregado:</span> carla@email.com</p>
              <p className="text-muted-foreground/70 mt-2">Password: qualquer valor</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
