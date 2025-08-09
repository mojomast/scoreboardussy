#define MyAppName "Improv Scoreboard"
#define MyAppVersion GetString(DocInfo, "MyAppVersion", "0.0.0-local")
#define MyAppPublisher "Cascade"
#define MyAppURL "https://github.com/"

; StageDir is provided by build-windows-installer.ps1 pointing to release\windows\stage
#define StageDir GetString(DocInfo, "StageDir", "")

[Setup]
AppId={{B7B3E4E8-9E2C-4F0A-9C92-87B24B5C2E52}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={pf}\ImprovScoreboard
DefaultGroupName=Improv Scoreboard
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename=ImprovScoreboard_{#MyAppVersion}_Setup
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
WizardStyle=modern

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked
Name: "autorun"; Description: "Start Improv Scoreboard when I sign in"; GroupDescription: "Startup:"; Flags: unchecked

[Files]
; Server exe
Source: "{#StageDir}\\server\\ImprovScoreboard.exe"; DestDir: "{app}\\server"; Flags: ignoreversion
; Client build
Source: "{#StageDir}\\client\\dist\\*"; DestDir: "{app}\\client\\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
; Data dir (empty) next to server exe (server expects ./data)
Source: "{#StageDir}\\server\\data\\*"; DestDir: "{app}\\server\\data"; Flags: ignoreversion recursesubdirs createallsubdirs
; Version file
Source: "{#StageDir}\\VERSION.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\\Improv Scoreboard"; Filename: "{app}\\server\\ImprovScoreboard.exe"; WorkingDir: "{app}\\server"; Comment: "Launch Improv Scoreboard"
Name: "{group}\\Uninstall Improv Scoreboard"; Filename: "{uninstallexe}"
Name: "{commondesktop}\\Improv Scoreboard"; Filename: "{app}\\server\\ImprovScoreboard.exe"; WorkingDir: "{app}\\server"; Tasks: desktopicon

[Registry]
; Optional autorun at user logon
Root: HKCU; Subkey: "Software\\Microsoft\\Windows\\CurrentVersion\\Run"; ValueType: string; ValueName: "ImprovScoreboard"; ValueData: "\"{app}\\server\\ImprovScoreboard.exe\""; Tasks: autorun

[Run]
; Add Windows Firewall rule to allow inbound on port 3001
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command \"New-NetFirewallRule -DisplayName 'ImprovScoreboard 3001' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any\""; Flags: runhidden
; Launch app after install
Filename: "{app}\\server\\ImprovScoreboard.exe"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent; WorkingDir: "{app}\\server"

[UninstallRun]
; Remove firewall rule on uninstall
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command \"Get-NetFirewallRule -DisplayName 'ImprovScoreboard 3001' -ErrorAction SilentlyContinue | Remove-NetFirewallRule\""; Flags: runhidden
