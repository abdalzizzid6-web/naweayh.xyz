import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/features/admin/EnterpriseAdminDashboard.tsx');

const statements = sourceFile.getStatements();
// The component is EnterpriseAdminDashboard
const component = sourceFile.getVariableDeclaration('EnterpriseAdminDashboard');
if (component) {
  const initializer = component.getInitializerIfKind(SyntaxKind.ArrowFunction);
  if (initializer) {
    const handleAddSource = initializer.getVariableDeclaration('handleAddSource');
    if (handleAddSource) {
      handleAddSource.getInitializerIfKind(SyntaxKind.ArrowFunction)?.replaceWithText(`async (newSource: any) => {
    const res = await fetch('/api/v1/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSource)
    });
    const data = await res.json();
    if (data.success) {
      fetch('/api/v1/sources').then(r => r.json()).then(d => { if(d.success) setSources(d.data); });
    }
  }`);
    }

    const handleToggleSourceStatus = initializer.getVariableDeclaration('handleToggleSourceStatus');
    if (handleToggleSourceStatus) {
      handleToggleSourceStatus.getInitializerIfKind(SyntaxKind.ArrowFunction)?.replaceWithText(`async (id: string) => {
    // We would call a toggle API here, for now just refetch after a mock toggle or implement toggle API
    const res = await fetch(\`/api/v1/sources/\${id}/toggle\`, { method: 'POST' });
    if (res.ok) {
      fetch('/api/v1/sources').then(r => r.json()).then(d => { if(d.success) setSources(d.data); });
    }
  }`);
    }
  }
}
sourceFile.saveSync();
