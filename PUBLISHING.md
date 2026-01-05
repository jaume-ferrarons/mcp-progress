# Publishing to npm

To publish this package to npm so anyone can use it with npx:

1. **Create an npm account** (if you don't have one)
   ```bash
   npm adduser
   ```

2. **Login to npm**
   ```bash
   npm login
   ```

3. **Update package.json**
   - Change the `name` if "mcp-progress" is already taken
   - Add your author information
   - Update the repository URL if you have one

4. **Publish the package**
   ```bash
   npm publish
   ```

5. **After publishing, anyone can use it with:**
   ```bash
   npx mcp-progress
   ```

## Before Publishing Checklist

- [ ] Choose a unique package name (check with `npm search mcp-progress`)
- [ ] Add your author name in package.json
- [ ] Add repository URL if available
- [ ] Test locally with `npm link` and `mcp-progress`
- [ ] Review README.md
- [ ] Make sure all files in `files` array exist

## Updating

To publish updates:
1. Update the version in package.json (follow semver: major.minor.patch)
2. Run `npm publish` again
