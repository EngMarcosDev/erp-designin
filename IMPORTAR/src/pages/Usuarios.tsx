import { useState } from 'react';
import { Plus, Search, Users as UsersIcon, Edit, Power, Shield, User, Key, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useERP } from '@/contexts/ERPContext';
import { ROLE_LABELS, PERMISSION_LABELS, Permission, UserRole } from '@/types/erp';
import { UserModal } from '@/components/modals/UserModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function UsuariosPage() {
  const { users, toggleUserStatus, batchToggleUserStatus, updateUser, updateUserPermissions, currentUser } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: '' });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permissionsModal, setPermissionsModal] = useState<{ open: boolean; userId: string | null; userName: string; permissions: Permission[]; role: UserRole }>({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO' });

  const isAdmin = currentUser.role === 'ADMIN';

  const filteredUsers = users
    .filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const handleEdit = (id: string) => {
    setEditingUserId(id);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: boolean) => {
    toggleUserStatus(id);
    toast.success(currentStatus ? `${name} foi desativado` : `${name} foi ativado`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredUsers.map(u => u.id) : []);
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBatchDeactivate = () => {
    if (selectedIds.length === 0) return;
    batchToggleUserStatus(selectedIds, false);
    toast.success(`${selectedIds.length} usuário(s) desativado(s)`);
    setSelectedIds([]);
  };

  const handleBatchActivate = () => {
    if (selectedIds.length === 0) return;
    batchToggleUserStatus(selectedIds, true);
    toast.success(`${selectedIds.length} usuário(s) ativado(s)`);
    setSelectedIds([]);
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    toast.success(`Senha de "${passwordModal.userName}" alterada com sucesso!`);
    setPasswordModal({ open: false, userId: null, userName: '' });
    setNewPassword('');
    setShowPassword(false);
  };

  const handleSavePermissions = () => {
    if (permissionsModal.userId) {
      updateUserPermissions(permissionsModal.userId, permissionsModal.permissions);
      updateUser(permissionsModal.userId, { role: permissionsModal.role });
      toast.success(`Permissões de "${permissionsModal.userName}" atualizadas!`);
    }
    setPermissionsModal({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO' });
  };

  const togglePermission = (perm: Permission) => {
    setPermissionsModal(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-success/10">
                <User className="h-6 w-6 text-status-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de Usuários</TabsTrigger>
          {isAdmin && <TabsTrigger value="permissoes">Gerenciar Permissões</TabsTrigger>}
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Search + Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="py-1.5">{selectedIds.length} selecionado(s)</Badge>
                <Button variant="destructive" size="sm" onClick={handleBatchDeactivate}>
                  <Power className="h-4 w-4 mr-1" /> Desativar
                </Button>
                <Button variant="default" size="sm" onClick={handleBatchActivate}>
                  <Power className="h-4 w-4 mr-1" /> Ativar
                </Button>
              </div>
            )}
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Nenhum usuário encontrado</h3>
                  <p className="text-sm text-muted-foreground/70 mb-4">
                    {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando seu primeiro usuário'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={cn(!user.active && 'opacity-60')}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                          {user.role === 'ADMIN' && <Shield className="h-4 w-4 text-accent shrink-0" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(user.role === 'ADMIN' ? 'bg-accent/10 text-accent' : '')}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'secondary'} className={cn(user.active ? 'bg-status-success' : 'bg-muted')}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(user.id)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPasswordModal({ open: true, userId: user.id, userName: user.name })}
                            title="Alterar senha"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={user.active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, user.name, user.active)}
                            title={user.active ? 'Desativar' : 'Ativar'}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Admin Permissions Tab */}
        {isAdmin && (
          <TabsContent value="permissoes" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Gerencie papéis, permissões e senhas dos usuários do sistema.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(user.role === 'ADMIN' ? 'bg-accent/10 text-accent' : '')}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(user.permissions || []).map(p => (
                              <Badge key={p} variant="outline" className="text-xs">{PERMISSION_LABELS[p]}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPermissionsModal({
                                open: true,
                                userId: user.id,
                                userName: user.name,
                                permissions: user.permissions || [],
                                role: user.role,
                              })}
                              title="Gerenciar permissões"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPasswordModal({ open: true, userId: user.id, userName: user.name })}
                              title="Alterar senha"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <UserModal open={isModalOpen} onClose={handleCloseModal} userId={editingUserId} />

      {/* Password Change Modal */}
      <Dialog open={passwordModal.open} onOpenChange={(open) => { if (!open) { setPasswordModal({ open: false, userId: null, userName: '' }); setNewPassword(''); setShowPassword(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="bg-primary/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Alterando senha de <strong>{passwordModal.userName}</strong></p>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordModal({ open: false, userId: null, userName: '' }); setNewPassword(''); }}>Cancelar</Button>
            <Button onClick={handleChangePassword}>Salvar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={permissionsModal.open} onOpenChange={(open) => { if (!open) setPermissionsModal({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO' }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="bg-accent/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permissões — {permissionsModal.userName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={permissionsModal.role} onValueChange={(v: UserRole) => setPermissionsModal(prev => ({ ...prev, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{ROLE_LABELS.ADMIN}</SelectItem>
                  <SelectItem value="USUARIO">{ROLE_LABELS.USUARIO}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Permissões</Label>
              {(Object.keys(PERMISSION_LABELS) as Permission[]).map(perm => (
                <div key={perm} className="flex items-center justify-between">
                  <span className="text-sm">{PERMISSION_LABELS[perm]}</span>
                  <Switch
                    checked={permissionsModal.permissions.includes(perm)}
                    onCheckedChange={() => togglePermission(perm)}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsModal({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO' })}>Cancelar</Button>
            <Button onClick={handleSavePermissions}>Salvar Permissões</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
