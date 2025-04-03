# Script PowerShell pour configurer uniquement les étendues DHCP
# Généré automatiquement le 03/04/2025 21:21:06
# Assurez-vous d'exécuter ce script en tant qu'administrateur sur le serveur cible

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

# Paramètres de configuration
Write-Host "Configuration des étendues DHCP - Paramètres prédéfinis" -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor Cyan

$DefaultGateway = "192.168.100.1"
$DNSServer = "8.8.8.8"

# Vérification que le service DHCP est disponible
# Installation du rôle DHCP et des outils d'administration
Write-Host "
Installation du rôle DHCP et des outils d'administration..." -ForegroundColor Cyan
try {
    Install-WindowsFeature DHCP -IncludeManagementTools -ErrorAction Stop
    Write-Host "Rôle DHCP installé avec succès." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de l'installation du rôle DHCP: $_" -ForegroundColor Red
    exit
}

try {
    $dhcpService = Get-Service DHCPServer -ErrorAction Stop
    if ($dhcpService.Status -ne "Running") {
        Write-Host "Le service DHCP n'est pas en cours d'exécution. Tentative de démarrage..." -ForegroundColor Yellow
        Start-Service DHCPServer -ErrorAction Stop
        Write-Host "Service DHCP démarré." -ForegroundColor Green
    } else {
        Write-Host "Service DHCP déjà en cours d'exécution." -ForegroundColor Green
    }
} catch {
    Write-Host "Erreur: Le service DHCP n'est pas installé ou ne peut pas être démarré." -ForegroundColor Red
    Write-Host "Veuillez installer le rôle DHCP avant d'exécuter ce script." -ForegroundColor Red
    exit
}

# Configuration des étendues DHCP
Write-Host "\nConfiguration des étendues DHCP..." -ForegroundColor Cyan

# Configuration de l'étendue 1: sous_réseau1
try {
    # Vérifier si l'étendue existe déjà
    $existingScope = Get-DhcpServerv4Scope -ScopeId 192.168.0.0 -ErrorAction SilentlyContinue
    if ($existingScope) {
        Write-Host "L'étendue 192.168.0.0 existe déjà. Suppression..." -ForegroundColor Yellow
        Remove-DhcpServerv4Scope -ScopeId 192.168.0.0 -Force
    }
    
    # Création de l'étendue
    Add-DhcpServerv4Scope -Name "sous_réseau1" -StartRange 192.168.0.11 -EndRange 192.168.0.249 -SubnetMask 255.255.255.0 -State Active -ErrorAction Stop
    Write-Host "Étendue DHCP sous_réseau1 créée avec succès." -ForegroundColor Green
    
    # Configuration des options DHCP
    Set-DhcpServerv4OptionValue -ScopeId 192.168.0.0 -Router $DefaultGateway -DnsServer $DNSServer -ErrorAction Stop
    Write-Host "Options DHCP pour sous_réseau1 configurées." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP sous_réseau1: $_" -ForegroundColor Red
}

# Configuration de l'étendue 2: sous_réseau2
try {
    # Vérifier si l'étendue existe déjà
    $existingScope = Get-DhcpServerv4Scope -ScopeId 192.168.1.0 -ErrorAction SilentlyContinue
    if ($existingScope) {
        Write-Host "L'étendue 192.168.1.0 existe déjà. Suppression..." -ForegroundColor Yellow
        Remove-DhcpServerv4Scope -ScopeId 192.168.1.0 -Force
    }
    
    # Création de l'étendue
    Add-DhcpServerv4Scope -Name "sous_réseau2" -StartRange 192.168.1.11 -EndRange 192.168.1.25 -SubnetMask 255.255.255.224 -State Active -ErrorAction Stop
    Write-Host "Étendue DHCP sous_réseau2 créée avec succès." -ForegroundColor Green
    
    # Configuration des options DHCP
    Set-DhcpServerv4OptionValue -ScopeId 192.168.1.0 -Router $DefaultGateway -DnsServer $DNSServer -ErrorAction Stop
    Write-Host "Options DHCP pour sous_réseau2 configurées." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP sous_réseau2: $_" -ForegroundColor Red
}

# Configuration de l'étendue 3: sous_réseau3
try {
    # Vérifier si l'étendue existe déjà
    $existingScope = Get-DhcpServerv4Scope -ScopeId 192.168.1.32 -ErrorAction SilentlyContinue
    if ($existingScope) {
        Write-Host "L'étendue 192.168.1.32 existe déjà. Suppression..." -ForegroundColor Yellow
        Remove-DhcpServerv4Scope -ScopeId 192.168.1.32 -Force
    }
    
    # Création de l'étendue
    Add-DhcpServerv4Scope -Name "sous_réseau3" -StartRange 192.168.1.33 -EndRange 192.168.1.46 -SubnetMask 255.255.255.240 -State Active -ErrorAction Stop
    Write-Host "Étendue DHCP sous_réseau3 créée avec succès." -ForegroundColor Green
    
    # Configuration des options DHCP
    Set-DhcpServerv4OptionValue -ScopeId 192.168.1.32 -Router $DefaultGateway -DnsServer $DNSServer -ErrorAction Stop
    Write-Host "Options DHCP pour sous_réseau3 configurées." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP sous_réseau3: $_" -ForegroundColor Red
}

# Configuration de l'étendue 4: sous_réseau4
try {
    # Vérifier si l'étendue existe déjà
    $existingScope = Get-DhcpServerv4Scope -ScopeId 192.168.1.48 -ErrorAction SilentlyContinue
    if ($existingScope) {
        Write-Host "L'étendue 192.168.1.48 existe déjà. Suppression..." -ForegroundColor Yellow
        Remove-DhcpServerv4Scope -ScopeId 192.168.1.48 -Force
    }
    
    # Création de l'étendue
    Add-DhcpServerv4Scope -Name "sous_réseau4" -StartRange 192.168.1.49 -EndRange 192.168.1.54 -SubnetMask 255.255.255.248 -State Active -ErrorAction Stop
    Write-Host "Étendue DHCP sous_réseau4 créée avec succès." -ForegroundColor Green
    
    # Configuration des options DHCP
    Set-DhcpServerv4OptionValue -ScopeId 192.168.1.48 -Router $DefaultGateway -DnsServer $DNSServer -ErrorAction Stop
    Write-Host "Options DHCP pour sous_réseau4 configurées." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP sous_réseau4: $_" -ForegroundColor Red
}

# Affichage des informations de configuration
Write-Host "\nRécapitulatif des étendues DHCP:" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "Passerelle par défaut : $DefaultGateway" -ForegroundColor White
Write-Host "Serveur DNS : $DNSServer" -ForegroundColor White
Write-Host "Nombre d'étendues configurées : 4" -ForegroundColor White

# Liste des étendues configurées
Get-DhcpServerv4Scope | Format-Table -Property ScopeId, Name, SubnetMask, StartRange, EndRange, State -AutoSize

Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "\nLa configuration des étendues DHCP est terminée." -ForegroundColor Green
shutdown /r /t 10
