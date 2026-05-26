import styled from "styled-components";
import { Nav, Footer } from "modules";
import { Colors } from "theme";
import { BackToTop } from "components";

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0 auto;
  overflow-x: hidden;
  overflow-x: clip;
  background-color: ${Colors.white};

  abbr {
    text-decoration: none;
  }
`;

interface PageProps {
  children: React.ReactNode;
}

export const Page = ({ children }: PageProps) => {
  return (
    <PageContainer>
      <Nav />
      <main role="main">{children}</main>
      <Footer />
      <BackToTop />
    </PageContainer>
  );
};
