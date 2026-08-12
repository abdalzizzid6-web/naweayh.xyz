import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('server/api/newsRouter.ts');

const statements = sourceFile.getStatements();
let lastPostIndex = -1;
for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  if (stmt.getText().startsWith("newsApiRouter.post('/v1/sources/:id/test'")) {
    lastPostIndex = i;
  }
}

if (lastPostIndex !== -1) {
  sourceFile.insertStatements(lastPostIndex + 1, `
// POST /api/v1/sources/:id/toggle
newsApiRouter.post('/v1/sources/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const dbRes = await pool.query('UPDATE news_sources SET enabled = NOT enabled, status = CASE WHEN enabled = false THEN \\'Active\\' ELSE \\'Paused\\' END WHERE id = $1 RETURNING *', [id]);
    res.json({ success: true, data: dbRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
`);
}
sourceFile.saveSync();
