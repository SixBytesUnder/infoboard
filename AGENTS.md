# Workspace Instructions & Memory

## Semantic Versioning Workflow
Whenever a feature, bug fix, or any change that warrants a version change is made:
1. Follow standard **Semantic Versioning (SemVer)**:
   - **PATCH (`x.y.Z`)**: Bug fixes, performance tweaks, minor refactors.
   - **MINOR (`x.Y.0`)**: Backward-compatible new features, new widgets, PWA additions, new integrations.
   - **MAJOR (`X.0.0`)**: Breaking API changes, architectural overhauls.
2. Update **`package.json`** with the new version.
3. Update **`package-lock.json`** to keep the root version synchronized.
4. Add a short entry to the `## Version History` section in **`README.md`**.
