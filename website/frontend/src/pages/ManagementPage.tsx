import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sessionsApi } from "@/services/session";
import { toast } from "sonner";
import { UserPlus, GraduationCap, Users } from "lucide-react";

const ManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [encarregados, setEncarregados] = useState<{ id: number; nome: string; email: string }[]>([]);

  // Teacher Form
  const [teacherForm, setTeacherForm] = useState({
    nome: "",
    email: "",
    password: ""
  });

  // Student Form
  const [studentForm, setStudentForm] = useState({
    nome: "",
    encarregadoId: ""
  });

  useEffect(() => {
    fetchEncarregados();
  }, []);

  const fetchEncarregados = async () => {
    try {
      const res = await sessionsApi.getEncarregados();
      setEncarregados(res.data);
    } catch (error) {
      console.error("Erro ao carregar encarregados", error);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sessionsApi.createTeacher({ ...teacherForm, tipo: 1 }); // Tipo 1 = Professor
      toast.success("Professor criado com sucesso!");
      setTeacherForm({ nome: "", email: "", password: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao criar professor");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.encarregadoId) {
      toast.error("Selecione um encarregado");
      return;
    }
    setLoading(true);
    try {
      await sessionsApi.createStudent({ 
        nome: studentForm.nome, 
        encarregadoId: parseInt(studentForm.encarregadoId) 
      });
      toast.success("Aluno criado com sucesso!");
      setStudentForm({ nome: "", encarregadoId: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao criar aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Gestão Académica</h1>
        <p className="text-muted-foreground mt-1">Criação de contas para professores e alunos</p>
      </div>

      <Tabs defaultValue="teachers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Professores
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Alunos
          </TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <CardTitle>Novo Professor</CardTitle>
                <CardDescription>
                  Crie uma conta para um novo professor. Eles poderão gerir o seu horário e disponibilidades.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeacher} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="t-name">Nome Completo</Label>
                    <Input 
                      id="t-name" 
                      placeholder="Ex: Maria Silva" 
                      value={teacherForm.nome}
                      onChange={e => setTeacherForm({...teacherForm, nome: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="t-email">Email Profissional</Label>
                    <Input 
                      id="t-email" 
                      type="email" 
                      placeholder="email@entartes.pt" 
                      value={teacherForm.email}
                      onChange={e => setTeacherForm({...teacherForm, email: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="t-pass">Senha Provisória</Label>
                    <Input 
                      id="t-pass" 
                      type="password" 
                      value={teacherForm.password}
                      onChange={e => setTeacherForm({...teacherForm, password: e.target.value})}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "A criar..." : "Criar Conta de Professor"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Novo Aluno</CardTitle>
                <CardDescription>
                  Registe um novo aluno e associe-o a um encarregado de educação existente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="s-name">Nome do Aluno</Label>
                    <Input 
                      id="s-name" 
                      placeholder="Ex: Pedro Santos" 
                      value={studentForm.nome}
                      onChange={e => setStudentForm({...studentForm, nome: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="s-enc">Encarregado de Educação</Label>
                    <select 
                      id="s-enc"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={studentForm.encarregadoId}
                      onChange={e => setStudentForm({...studentForm, encarregadoId: e.target.value})}
                      required
                    >
                      <option value="">Selecione um encarregado...</option>
                      {encarregados.map(enc => (
                        <option key={enc.id} value={enc.id}>
                          {enc.nome} ({enc.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "A criar..." : "Registar Aluno"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
};

export default ManagementPage;
