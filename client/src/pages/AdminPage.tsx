import AdminPanel from '@/components/admin/AdminPanel';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Shield, ArrowLeft } from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  // Check if the user is an admin
  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Alert variant="destructive" className="mb-6">
          <Shield className="h-4 w-4 mr-2" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin panel. This area is restricted to administrators only.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation('/')} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" /> Return to Home
        </Button>
      </div>
    );
  }

  return <AdminPanel />;
};

export default AdminPage;
