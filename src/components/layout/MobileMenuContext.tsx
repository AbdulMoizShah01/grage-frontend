import { createContext, useContext, ReactNode } from 'react';

type MobileMenuContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  return context; // Returns undefined if not in provider, allowing optional usage
};

type MobileMenuProviderProps = {
  children: ReactNode;
  value: MobileMenuContextType;
};

export const MobileMenuProvider = ({ children, value }: MobileMenuProviderProps) => {
  return (
    <MobileMenuContext.Provider value={value}>
      {children}
    </MobileMenuContext.Provider>
  );
};

