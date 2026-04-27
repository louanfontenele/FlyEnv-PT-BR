import { execPromiseWithEnv as execPromise } from '../../Fn'

export async function pcReportWindows(): Promise<any> {
  const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $os=Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture; $cpu=Get-CimInstance Win32_Processor | Select-Object Name,Manufacturer,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed; $mem=Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity,ConfiguredClockSpeed,Speed,SMBIOSMemoryType,MemoryType,Manufacturer,PartNumber,BankLabel,DeviceLocator; $memArray=Get-CimInstance Win32_PhysicalMemoryArray | Select-Object MemoryDevices; $gpu=Get-CimInstance Win32_VideoController | Select-Object Name,AdapterCompatibility,DriverVersion,AdapterRAM,CurrentHorizontalResolution,CurrentVerticalResolution,VideoProcessor,PNPDeviceID,VideoMemoryType; $computer=Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer,Model,SystemType,TotalPhysicalMemory; $nvidia=@(); if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) { try { $raw = & nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits 2>$null; foreach ($line in $raw) { $parts = $line -split ',' | ForEach-Object { $_.Trim() }; if ($parts.Length -ge 3) { $nvidia += [PSCustomObject]@{ Name=$parts[0]; MemoryTotalMiB=[int]$parts[1]; DriverVersion=$parts[2] } } } } catch {} }; [PSCustomObject]@{ os=$os; cpu=$cpu; memory=$mem; memoryArray=$memArray; gpu=$gpu; computer=$computer; nvidia=$nvidia } | ConvertTo-Json -Depth 8 -Compress"`
  try {
    const res = await execPromise(command)
    const stdout = `${res?.stdout ?? ''}`.trim()
    if (!stdout) {
      return {}
    }
    return JSON.parse(stdout)
  } catch {
    return {}
  }
}
