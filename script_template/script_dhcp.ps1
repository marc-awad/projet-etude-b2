# Script PowerShell pour configurer directement un serveur DHCP (sans configuration DNS)
# Assurez-vous d'exécuter ce script en tant qu'administrateur sur le serveur cible

# Fonction pour obtenir une entrée utilisateur avec validation
function Get-ValidatedInput {
    param (
        [string]$Prompt,
        [string]$Default,
        [scriptblock]$Validation = { $true }
    )
    
    do {
        $input = Read-Host "$Prompt [$Default]"
        if ([string]::IsNullOrWhiteSpace($input)) { $input = $Default }
        $valid = & $Validation $input
        if (-not $valid) {
            Write-Host "Entrée invalide. Veuillez réessayer." -ForegroundColor Red
        }
    } while (-not $valid)
    
    return $input
}

# Fonction pour valider une adresse IP
function Test-IPAddress {
    param ([string]$IP)
    return $IP -match "^(\d{1,3}\.){3}\d{1,3}$"
}

# Fonction pour vérifier si l'exécution est en mode administrateur
function Test-Administrator {
    $user = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($user)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Vérification des privilèges d'administrateur
if (-not (Test-Administrator)) {
    Write-Host "Ce script nécessite des privilèges d'administrateur. Veuillez l'exécuter en tant qu'administrateur." -ForegroundColor Red
    exit
}

# Collecte des paramètres utilisateur
Write-Host "Configuration du serveur DHCP - Saisie des paramètres" -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor Cyan

$DHCPServerIP = Get-ValidatedInput -Prompt "Adresse IP du serveur DHCP" -Default "192.168.100.10" -Validation { param($ip) Test-IPAddress $ip }
$DefaultGateway = Get-ValidatedInput -Prompt "Adresse IP de la passerelle par défaut" -Default "192.168.100.1" -Validation { param($ip) Test-IPAddress $ip }
$DHCPScopeID = Get-ValidatedInput -Prompt "ID de l'étendue DHCP (adresse réseau)" -Default "192.168.100.0" -Validation { param($ip) Test-IPAddress $ip }
$DHCPScopeName = Get-ValidatedInput -Prompt "Nom de l'étendue DHCP" -Default "Réseau Local"
$DHCPStartRange = Get-ValidatedInput -Prompt "Début de la plage d'adresses DHCP" -Default "192.168.100.100" -Validation { param($ip) Test-IPAddress $ip }
$DHCPEndRange = Get-ValidatedInput -Prompt "Fin de la plage d'adresses DHCP" -Default "192.168.100.200" -Validation { param($ip) Test-IPAddress $ip }
$DHCPSubnetMask = Get-ValidatedInput -Prompt "Masque de sous-réseau" -Default "255.255.255.0" -Validation { param($ip) Test-IPAddress $ip }

# Affichage des interfaces réseau disponibles
Write-Host "`nInterfaces réseau disponibles:" -ForegroundColor Cyan
Get-NetAdapter | Format-Table -Property Name, InterfaceDescription, Status

$NetworkInterfaceAlias = Get-ValidatedInput -Prompt "Nom de l'interface réseau à utiliser" -Default "Ethernet" -Validation {
    param($name)
    $adapter = Get-NetAdapter | Where-Object { $_.Name -eq $name }
    if ($adapter) { return $true }
    Write-Host "Interface introuvable. Veuillez choisir une interface dans la liste ci-dessus." -ForegroundColor Red
    return $false
}

# Confirmation des paramètres
Write-Host "`nRécapitulatif des paramètres:" -ForegroundColor Yellow
Write-Host "Adresse IP du serveur : $DHCPServerIP" -ForegroundColor White
Write-Host "Passerelle par défaut : $DefaultGateway" -ForegroundColor White
Write-Host "ID de l'étendue DHCP : $DHCPScopeID" -ForegroundColor White
Write-Host "Nom de l'étendue : $DHCPScopeName" -ForegroundColor White
Write-Host "Plage d'adresses : $DHCPStartRange - $DHCPEndRange" -ForegroundColor White
Write-Host "Masque de sous-réseau : $DHCPSubnetMask" -ForegroundColor White
Write-Host "Interface réseau : $NetworkInterfaceAlias" -ForegroundColor White

$confirmation = Read-Host "`nConfirmez-vous ces paramètres? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "Configuration annulée par l'utilisateur." -ForegroundColor Red
    exit
}

# Installation du rôle DHCP
Write-Host "`nInstallation du rôle DHCP et des outils d'administration..." -ForegroundColor Cyan
try {
    Install-WindowsFeature DHCP -IncludeManagementTools -ErrorAction Stop
    Write-Host "Rôle DHCP installé avec succès." -ForegroundColor Green
}
catch {
    Write-Host "Erreur lors de l'installation du rôle DHCP: $_" -ForegroundColor Red
    exit
}

# Configuration de l'adresse IP statique
Write-Host "`nConfiguration de l'adresse IP statique ($DHCPServerIP)..." -ForegroundColor Cyan
try {
    # Supprimer les configurations IP existantes
    Remove-NetIPAddress -InterfaceAlias $NetworkInterfaceAlias -Confirm:$false -ErrorAction SilentlyContinue
    
    # Configurer la nouvelle adresse IP
    New-NetIPAddress -IPAddress $DHCPServerIP -PrefixLength 24 -InterfaceAlias $NetworkInterfaceAlias -DefaultGateway $DefaultGateway -ErrorAction Stop
    
    Write-Host "Configuration IP réussie." -ForegroundColor Green
}
catch {
    Write-Host "Erreur lors de la configuration de l'adresse IP: $_" -ForegroundColor Red
    Write-Host "Poursuite du script..." -ForegroundColor Yellow
}

# Compléter l'installation du service DHCP
Write-Host "`nFinalisation de l'installation du service DHCP..." -ForegroundColor Cyan
try {
    # Création du répertoire pour les sauvegardes DHCP
    $DHCPBackupPath = "$env:SystemRoot\System32\dhcp\backup"
    if (-not (Test-Path $DHCPBackupPath)) {
        New-Item -Path $DHCPBackupPath -ItemType Directory -Force
    }
    
    # Configuration du service DHCP
    Set-ItemProperty -Path HKLM:\SOFTWARE\Microsoft\ServerManager\Roles\12 -Name ConfigurationState -Value 2
    
    # Redémarrage du service DHCP
    Restart-Service DHCPServer -ErrorAction Stop
    
    Write-Host "Service DHCP configuré." -ForegroundColor Green
}
catch {
    Write-Host "Erreur lors de la configuration du service DHCP: $_" -ForegroundColor Red
}

# Autorisation du serveur DHCP dans Active Directory (si AD est présent)
Write-Host "`nVérification si Active Directory est présent..." -ForegroundColor Cyan
$isDomainController = (Get-WmiObject -Class Win32_ComputerSystem).DomainRole -ge 4
if ($isDomainController) {
    try {
        Write-Host "Autorisation du serveur DHCP dans Active Directory..." -ForegroundColor Cyan
        Add-DhcpServerInDC -ErrorAction Stop
        Write-Host "Serveur DHCP autorisé dans Active Directory." -ForegroundColor Green
    }
    catch {
        Write-Host "Erreur lors de l'autorisation du serveur DHCP dans AD: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "Active Directory non détecté. Pas besoin d'autoriser le serveur DHCP." -ForegroundColor Yellow
}

# Configuration de l'étendue DHCP
Write-Host "`nConfiguration de l'étendue DHCP..." -ForegroundColor Cyan
try {
    # Vérifier si l'étendue existe déjà
    $existingScope = Get-DhcpServerv4Scope -ScopeId $DHCPScopeID -ErrorAction SilentlyContinue
    if ($existingScope) {
        Write-Host "L'étendue $DHCPScopeID existe déjà. Suppression..." -ForegroundColor Yellow
        Remove-DhcpServerv4Scope -ScopeId $DHCPScopeID -Force
    }
    
    # Création de l'étendue
    Add-DhcpServerv4Scope -Name $DHCPScopeName -StartRange $DHCPStartRange -EndRange $DHCPEndRange -SubnetMask $DHCPSubnetMask -State Active -ErrorAction Stop
    Write-Host "Étendue DHCP créée avec succès." -ForegroundColor Green
    
    # Configuration des options DHCP (uniquement la passerelle, pas de DNS)
    Set-DhcpServerv4OptionValue -ScopeId $DHCPScopeID -Router $DefaultGateway -ErrorAction Stop
    Write-Host "Option passerelle DHCP configurée." -ForegroundColor Green
}
catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP: $_" -ForegroundColor Red
}

# Redémarrage du service DHCP
Write-Host "`nRedémarrage du service DHCP..." -ForegroundColor Cyan
Restart-Service DHCPServer
Write-Host "Service DHCP redémarré." -ForegroundColor Green

# Affichage des informations de configuration
Write-Host "`nRécapitulatif de la configuration du serveur DHCP:" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "Adresse IP du serveur : $DHCPServerIP" -ForegroundColor White
Write-Host "Étendue DHCP : $DHCPScopeName ($DHCPStartRange - $DHCPEndRange)" -ForegroundColor White
Write-Host "Masque de sous-réseau : $DHCPSubnetMask" -ForegroundColor White
Write-Host "Passerelle par défaut : $DefaultGateway" -ForegroundColor White
Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "`nLa configuration du serveur DHCP est terminée." -ForegroundColor Green
Write-Host "Pour vérifier la configuration, ouvrez le gestionnaire DHCP (dhcpmgmt.msc)" -ForegroundColor Yellow