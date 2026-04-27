import { execPromiseWithEnv as execPromise } from '../../Fn'
import { totalmem } from 'os'

function parseSizeToBytes(sizeStr: string): number {
  const text = `${sizeStr || ''}`.trim().toUpperCase()
  const m = text.match(/([\d.]+)\s*(GB|MB|TB|KB|B)/)
  if (!m) return 0
  const val = parseFloat(m[1])
  const unit = m[2]
  if (unit === 'TB') return val * 1024 * 1024 * 1024 * 1024
  if (unit === 'GB') return val * 1024 * 1024 * 1024
  if (unit === 'MB') return val * 1024 * 1024
  if (unit === 'KB') return val * 1024
  return val
}

function parseSpeedToMHz(speedStr: string): number {
  const text = `${speedStr || ''}`.trim().toUpperCase()
  const m = text.match(/([\d.]+)\s*(GHZ|MHZ|MT\/S)/)
  if (!m) return 0
  const val = parseFloat(m[1])
  const unit = m[2]
  if (unit === 'GHZ') return val * 1000
  return val
}

function ddrTypeFromString(typeStr: string): number {
  const t = `${typeStr || ''}`.toUpperCase()
  if (t.includes('DDR5')) return 34
  if (t.includes('DDR4')) return 26
  if (t.includes('DDR3')) return 24
  if (t.includes('DDR2')) return 21
  if (t.includes('DDR')) return 20
  return 0
}

export async function pcReportMacOS(): Promise<any> {
  try {
    const res = await execPromise(
      'system_profiler SPHardwareDataType SPSoftwareDataType SPMemoryDataType SPDisplaysDataType -json'
    )
    const stdout = `${res?.stdout ?? ''}`.trim()
    if (!stdout) {
      return fallbackPcReportMacOS()
    }
    const json = JSON.parse(stdout)

    const hardware = json?.SPHardwareDataType?.[0] || {}
    const software = json?.SPSoftwareDataType?.[0] || {}

    const osVersionStr = `${software?.os_version || ''}`
    let osCaption = osVersionStr || 'macOS'
    if (osCaption && !osCaption.toLowerCase().startsWith('macos')) {
      osCaption = `macOS ${osCaption}`
    }
    const buildMatch = osVersionStr.match(/\(([^)]+)\)/)
    const buildNumber = buildMatch ? buildMatch[1] : ''

    const cpuName = hardware?.chip_type || hardware?.cpu_type || 'Unknown'
    const isAppleSilicon = /apple\s*m\d/i.test(`${cpuName}`)
    const processorMatch = `${hardware?.number_processors || ''}`.match(/proc\s+(\d+)/)
    const processorCount = parseInt(processorMatch?.[1] || '1', 10) || 1
    const speedStr = `${hardware?.current_processor_speed || ''}`
    const speedMHz = parseSpeedToMHz(speedStr)

    const cpu = [
      {
        Name: cpuName,
        Manufacturer: isAppleSilicon ? 'Apple' : 'Intel',
        NumberOfCores: processorCount,
        NumberOfLogicalProcessors: processorCount,
        MaxClockSpeed: speedMHz
      }
    ]

    const memItems = json?.SPMemoryDataType || []
    const memoryArr = memItems.map((item: any) => ({
      Capacity: parseSizeToBytes(`${item?.SPMemoryDataType || item?.dimm_size || ''}`),
      ConfiguredClockSpeed: parseSpeedToMHz(`${item?.dimm_speed || ''}`),
      Speed: parseSpeedToMHz(`${item?.dimm_speed || ''}`),
      SMBIOSMemoryType: ddrTypeFromString(`${item?.dimm_type || ''}`),
      MemoryType: ddrTypeFromString(`${item?.dimm_type || ''}`),
      Manufacturer: `${item?.dimm_manufacturer || 'Apple'}`,
      PartNumber: `${item?.dimm_part_number || ''}`,
      BankLabel: `${item?.dimm_bank || ''}`,
      DeviceLocator: `${item?.dimm_slot || ''}`
    }))

    const memoryArray = [
      {
        MemoryDevices: memItems.length || 1
      }
    ]

    const displayItems = json?.SPDisplaysDataType || []
    const gpu = displayItems.map((item: any) => {
      const name = `${item?.sppci_model || item?._name || 'Unknown'}`
      const isAppleGpu = /apple\s*m\d/i.test(name.toLowerCase())
      let vramBytes = parseSizeToBytes(`${item?.spdisplays_vram || ''}`)
      if (isAppleGpu && vramBytes === 0) {
        vramBytes = totalmem()
      }
      return {
        Name: name,
        AdapterCompatibility: isAppleGpu ? 'Apple' : 'Unknown',
        DriverVersion: `${item?.spdisplays_ndrvs?.[0]?.['_name'] || ''}`,
        AdapterRAM: vramBytes,
        CurrentHorizontalResolution: 0,
        CurrentVerticalResolution: 0,
        VideoProcessor: name,
        PNPDeviceID: ''
      }
    })

    const computer = {
      Manufacturer: 'Apple',
      Model: `${hardware?.machine_name || hardware?.machine_model || 'Mac'}`,
      SystemType: isAppleSilicon ? 'Apple Silicon' : 'Intel',
      TotalPhysicalMemory: totalmem()
    }

    let nvidia: any[] = []
    try {
      const nvidiaRes = await execPromise(
        'nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits'
      )
      const nvidiaStdout = `${nvidiaRes?.stdout ?? ''}`.trim()
      if (nvidiaStdout) {
        nvidia = nvidiaStdout.split('\n').map((line) => {
          const parts = line.split(',').map((s) => s.trim())
          return {
            Name: parts[0] || '',
            MemoryTotalMiB: parseInt(parts[1] || '0', 10) || 0,
            DriverVersion: parts[2] || ''
          }
        })
      }
    } catch {}

    return {
      os: {
        Caption: osCaption,
        Version: `${software?.os_version || ''}`,
        BuildNumber: buildNumber,
        OSArchitecture: process.arch
      },
      cpu,
      memory: memoryArr,
      memoryArray,
      gpu,
      computer,
      nvidia
    }
  } catch {
    return fallbackPcReportMacOS()
  }
}

function fallbackPcReportMacOS(): any {
  return {
    os: {
      Caption: `macOS`,
      Version: '',
      BuildNumber: '',
      OSArchitecture: process.arch
    },
    cpu: [],
    memory: [],
    memoryArray: [],
    gpu: [],
    computer: {
      Manufacturer: 'Apple',
      Model: 'Mac',
      SystemType: process.arch === 'arm64' ? 'Apple Silicon' : 'Intel',
      TotalPhysicalMemory: totalmem()
    },
    nvidia: []
  }
}
