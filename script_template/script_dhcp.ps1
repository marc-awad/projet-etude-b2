# Script PowerShell pour configurer directement un serveur DHCP (sans configuration DNS)
# Assurez-vous d'exécuter ce script en tant qu'administrateur sur le serveur cible

# Paramètres de configuration DHCP
$DHCPServerIP = "192.168.100.10"
$DefaultGateway = "192.168.100.1"
$DHCPScopeID = "192.168.100.0"
$DHCPScopeName = "Réseau Local"
$DHCPStartRange = "192.168.100.100"
$DHCPEndRange = "192.168.100.200"
$DHCPSubnetMask = "255.255.255.0"
$NetworkInterfaceAlias = "Ethernet"

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

# Installation du rôle DHCP
Write-Host "Installation du rôle DHCP et des outils d'administration..." -ForegroundColor Cyan
try {
    Install-WindowsFeature DHCP -IncludeManagementTools -ErrorAction Stop
    Write-Host "Rôle DHCP installé avec succès." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de l'installation du rôle DHCP: $_" -ForegroundColor Red
    exit
}

# Configuration de l'adresse IP statique
Write-Host "Configuration de l'adresse IP statique ($DHCPServerIP)..." -ForegroundColor Cyan
try {
    # Vérifier si l'interface réseau existe
    $netAdapter = Get-NetAdapter | Where-Object { $_.Name -eq $NetworkInterfaceAlias }
    if (-not $netAdapter) {
        Write-Host "L'interface '$NetworkInterfaceAlias' n'existe pas. Interfaces disponibles:" -ForegroundColor Yellow
        Get-NetAdapter | Format-Table Name, InterfaceDescription
        $NetworkInterfaceAlias = Read-Host "Entrez le nom de l'interface réseau à utiliser"
    }
    
    # Supprimer les configurations IP existantes
    Remove-NetIPAddress -InterfaceAlias $NetworkInterfaceAlias -Confirm:$false -ErrorAction SilentlyContinue
    
    # Configurer la nouvelle adresse IP
    New-NetIPAddress -IPAddress $DHCPServerIP -PrefixLength 24 -InterfaceAlias $NetworkInterfaceAlias -DefaultGateway $DefaultGateway -ErrorAction Stop
    
    Write-Host "Configuration IP réussie." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'adresse IP: $_" -ForegroundColor Red
    Write-Host "Poursuite du script..." -ForegroundColor Yellow
}

# Compléter l'installation du service DHCP
Write-Host "Finalisation de l'installation du service DHCP..." -ForegroundColor Cyan
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
} catch {
    Write-Host "Erreur lors de la configuration du service DHCP: $_" -ForegroundColor Red
}

# Autorisation du serveur DHCP dans Active Directory (si AD est présent)
Write-Host "Vérification si Active Directory est présent..." -ForegroundColor Cyan
$isDomainController = (Get-WmiObject -Class Win32_ComputerSystem).DomainRole -ge 4
if ($isDomainController) {
    try {
        Write-Host "Autorisation du serveur DHCP dans Active Directory..." -ForegroundColor Cyan
        Add-DhcpServerInDC -ErrorAction Stop
        Write-Host "Serveur DHCP autorisé dans Active Directory." -ForegroundColor Green
    } catch {
        Write-Host "Erreur lors de l'autorisation du serveur DHCP dans AD: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Active Directory non détecté. Pas besoin d'autoriser le serveur DHCP." -ForegroundColor Yellow
}

# Configuration de l'étendue DHCP
Write-Host "Configuration de l'étendue DHCP..." -ForegroundColor Cyan
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
} catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP: $_" -ForegroundColor Red
}

# Redémarrage du service DHCP
Write-Host "Redémarrage du service DHCP..." -ForegroundColor Cyan
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