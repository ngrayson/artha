# 🚀 Quick Start - Vault Scanning

## 📋 One-Command Vault Scanning

You can now scan any Obsidian vault from any directory using these simple commands:

### PowerShell (Recommended)
```powershell
# From any directory
C:\_Dev\Artha\artha\scan-vault.ps1 "C:\Users\$env:USERNAME\Documents\Vaults\The Study"

# Or if you're in the Artha directory
.\scan-vault.ps1 "C:\Users\$env:USERNAME\Documents\Vaults\The Study"
```

### Windows Batch File
```cmd
# From any directory
C:\_Dev\Artha\artha\scan-vault.bat "C:\Users\%USERNAME%\Documents\Vaults\The Study"

# Or if you're in the Artha directory
scan-vault.bat "C:\Users\%USERNAME%\Documents\Vaults\The Study"
```

### Direct Node.js (Alternative)
```bash
# From any directory
node "C:\_Dev\Artha\artha\packages\script-layer\dist\simple-scan.js" "C:\Users\$USERNAME\Documents\Vaults\The Study"
```

## 🎯 What You Get

- **Professional ASCII Table** with perfect column alignment
- **Top 10 Tasks** sorted by status and due date
- **Parent Project Information** extracted from Obsidian links
- **Clean Summary** with overdue and weekly task counts
- **Beautiful Formatting** using cli-table3

## 🔧 Requirements

- **Node.js** installed and in PATH
- **Script built** (run `npm run build` in script-layer directory if needed)
- **Valid Obsidian vault** with `_projects` directory

## 📁 File Locations

- **PowerShell Script**: `C:\_Dev\Artha\artha\scan-vault.ps1`
- **Batch File**: `C:\_Dev\Artha\artha\scan-vault.bat`
- **Node.js Script**: `C:\_Dev\Artha\artha\packages\script-layer\dist\simple-scan.js`

## 💡 Pro Tips

1. **Create a shortcut** to the PowerShell script for quick access
2. **Add to PATH** for global access from anywhere
3. **Use tab completion** for vault path suggestions
4. **Check the output** for any missing dependencies

## 🚨 Troubleshooting

- **"Script not found"**: Run `npm run build` in the script-layer directory
- **"Node.js not found"**: Install Node.js and add to PATH
- **"Vault path not found"**: Check the path and ensure it exists
- **"No _projects directory"**: Ensure the vault follows PARA organization

---

**Ready to scan!** 🎉
