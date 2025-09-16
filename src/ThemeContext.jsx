import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

// Provider컴포넌트 생성: 자식 컴포넌트들에게 테마 정보를 제공
export function ThemeProvider({ children }) {
  // 현재 테마를 저장하는 state ('light' 또는 'dark')
  const [theme, setTheme] = useState(
    // localStorage에 저장된 테마가 있으면 가져오고, 없으면 'light'를 기본값으로 사용
    () => localStorage.getItem('theme') || 'light'
  );

  // 테마를 바꾸는 함수
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // theme state가 바뀔 때마다 실행
  useEffect(() => {
    // 현재 테마를 <html> 태그에 'data-theme' 속성으로 적용
    document.documentElement.setAttribute('data-theme', theme);
    // 사용자의 선택을 localStorage에 저장하여 다음 방문 시에도 기억
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 자식 컴포넌트에게 현재 테마와 테마를 바꾸는 함수를 물려줌
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 커스텀 훅 생성: 다른 컴포넌트에서 쉽게 테마 정보를 가져다 쓸 수 있도록 함
export const useTheme = () => useContext(ThemeContext);
