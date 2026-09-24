import AppleLoadingScreen from '@/components/ui/AppleLoadingScreen'

export default function Loading() {
  return (
    <AppleLoadingScreen 
      fullScreen={false} 
      label="Accessing Workspace Stream"
      sublabel="Cultlike OS // Ultra-Low Latency"
    />
  )
}
