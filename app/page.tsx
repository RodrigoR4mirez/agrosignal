import { redirect } from 'next/navigation'

// El marketplace es la página principal de AgroSignal.
export default function Home() {
  redirect('/marketplace')
}
