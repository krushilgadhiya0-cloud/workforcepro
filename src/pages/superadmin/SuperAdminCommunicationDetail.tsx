import { useParams } from 'react-router-dom';
import { Communication } from '../Communication';

export function SuperAdminCommunicationDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  return <Communication companyId={companyId} isSuperAdmin />;
}
