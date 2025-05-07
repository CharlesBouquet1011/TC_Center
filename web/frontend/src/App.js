import './App.css';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold">TC Center</h1>
          <p className="mt-2 text-xl">Votre Datacenter Intelligent</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Bienvenue dans TC Center</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une solution innovante pour la gestion et le déploiement de vos applications
            dans un environnement Kubernetes optimisé.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Déploiement Automatisé</h3>
            <p className="text-gray-600">
              Déployez vos applications Docker sur Kubernetes en quelques clics.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Gestion Simplifiée</h3>
            <p className="text-gray-600">
              Interface intuitive pour gérer vos ressources et services.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Monitoring en Temps Réel</h3>
            <p className="text-gray-600">
              Surveillez vos applications et ressources en temps réel.
            </p>
          </div>
        </section>

        {/* File Upload Section */}
        <section className="max-w-2xl mx-auto">
          <FileUpload />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center">© 2025 TC Center. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;