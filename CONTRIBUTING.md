# Contributing to EstateOS AI / ZillowCore

We welcome contributions to the EstateOS AI enterprise platform.

## Development Workflow
1. Ensure Python 3.10+ and Node.js 18+ are installed.
2. Install backend dependencies: `cd backend && pip install -r requirements.txt`.
3. Install frontend dependencies: `cd frontend && npm install`.
4. Ensure all 13 test suites pass before submitting PRs:
   ```bash
   $env:PYTHONPATH="backend"
   python -m pytest backend/tests/ -v
   ```
5. Build the frontend to verify type-checking:
   ```bash
   cd frontend && npm run build
   ```

## Code Quality Standards
- Preserve all docstrings and type annotations.
- Multi-tenancy isolation must be enforced on every new API endpoint with `org_id == current_user.org_id`.
- Follow PEP 8 for Python and ESLint/Prettier standards for TypeScript.

