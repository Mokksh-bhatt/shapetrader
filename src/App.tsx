import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppShell } from '@/layout/AppShell';
import { HomeScreen } from '@/screens/Home/HomeScreen';
import { CandlestickShapesScreen } from '@/screens/CandlestickShapes/CandlestickShapesScreen';
import { ChartPatternsScreen } from '@/screens/ChartPatterns/ChartPatternsScreen';
import { CaseStudiesScreen } from '@/screens/CaseStudies/CaseStudiesScreen';
import { CaseStudyWalkthrough } from '@/screens/CaseStudies/CaseStudyWalkthrough';
import { TradeSimulatorScreen } from '@/screens/TradeSimulator/TradeSimulatorScreen';
import { DashboardScreen } from '@/screens/Dashboard/DashboardScreen';
import { GlossaryScreen } from '@/screens/Glossary/GlossaryScreen';

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/candlesticks" element={<CandlestickShapesScreen />} />
          <Route path="/patterns" element={<ChartPatternsScreen />} />
          <Route path="/case-studies" element={<CaseStudiesScreen />} />
          <Route path="/case-studies/:caseId" element={<CaseStudyWalkthrough />} />
          <Route path="/simulator" element={<TradeSimulatorScreen />} />
          <Route path="/progress" element={<DashboardScreen />} />
          <Route path="/glossary" element={<GlossaryScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
