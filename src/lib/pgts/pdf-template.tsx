import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    position: "absolute",
    top: 20,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#0d9488",
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 8,
    color: "#0d9488",
    fontFamily: "Helvetica-Bold",
  },
  headerSubtitle: {
    fontSize: 7,
    color: "#6b7280",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0d9488",
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccfbf1",
    paddingBottom: 4,
  },
  sectionText: {
    fontSize: 10,
    color: "#374151",
    textAlign: "justify",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0fdfa",
    borderBottomWidth: 1,
    borderBottomColor: "#0d9488",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0d9488",
  },
  signatureSection: {
    marginTop: 40,
    alignItems: "center",
  },
  signatureLine: {
    width: 250,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  infoBox: {
    backgroundColor: "#f0fdfa",
    borderWidth: 1,
    borderColor: "#ccfbf1",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: "#111827",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryItem: {
    width: "30%",
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0d9488",
  },
  summaryLabel: {
    fontSize: 7,
    color: "#6b7280",
    marginTop: 2,
  },
});

export interface PgtsEquipment {
  name: string;
  brand: string | null;
  model: string | null;
  patrimony: string | null;
  serialNumber: string | null;
  criticality: string;
  status: string;
}

export interface PgtsDocumentProps {
  hospitalName: string;
  cnpj: string;
  generatedByName: string;
  generatedAt: string;
  sections: Record<string, string>;
  equipments: PgtsEquipment[];
  equipmentSummary: {
    total: number;
    critA: number;
    critB: number;
    critC: number;
    ativos: number;
    inativos: number;
  };
  maintenanceSummary: {
    preventivas: number;
    calibracoes: number;
    tse: number;
    realizadas: number;
    vencidas: number;
  };
  trainingSummary: {
    total: number;
    completions: number;
  };
}

const SECTION_LABELS: Record<string, string> = {
  identificacao: "1. Identifica\u00e7\u00e3o do Estabelecimento",
  objetivo: "2. Objetivo do Plano",
  estrutura_organizacional: "3. Estrutura Organizacional",
  inventario: "4. Invent\u00e1rio de Tecnologias",
  etapas_gerenciamento: "5. Etapas do Gerenciamento",
  gerenciamento_riscos: "6. Gerenciamento de Riscos",
  rastreabilidade: "7. Rastreabilidade",
  capacitacao: "8. Capacita\u00e7\u00e3o e Treinamento",
  infraestrutura: "9. Infraestrutura F\u00edsica",
  documentacao: "10. Documenta\u00e7\u00e3o e Registros",
  avaliacao_anual: "11. Avalia\u00e7\u00e3o Anual",
  anexos: "12. Anexos",
};

function Header({ hospitalName }: { hospitalName: string }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.headerTitle}>PGTS — {hospitalName}</Text>
      <Text style={styles.headerSubtitle}>RDC 509/2021 — Anvisa</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Gerado pelo Vitalis {"\u2014"} Sistema de Gest{"\u00e3"}o de Engenharia Cl{"\u00ed"}nica</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `P\u00e1gina ${pageNumber} de ${totalPages}`}
      />
    </View>
  );
}

function EquipmentTable({ equipments }: { equipments: PgtsEquipment[] }) {
  const colWidths = ["25%", "15%", "15%", "15%", "10%", "10%", "10%"];

  return (
    <View>
      <View style={styles.tableHeader}>
        {["Nome", "Marca", "Modelo", "Patrim\u00f4nio", "N\u00ba S\u00e9rie", "Crit.", "Status"].map(
          (h, i) => (
            <Text key={h} style={[styles.tableCellHeader, { width: colWidths[i] }]}>
              {h}
            </Text>
          )
        )}
      </View>
      {equipments.map((eq, idx) => (
        <View key={idx} style={styles.tableRow} wrap={false}>
          <Text style={[styles.tableCell, { width: colWidths[0] }]}>{eq.name}</Text>
          <Text style={[styles.tableCell, { width: colWidths[1] }]}>{eq.brand || "—"}</Text>
          <Text style={[styles.tableCell, { width: colWidths[2] }]}>{eq.model || "—"}</Text>
          <Text style={[styles.tableCell, { width: colWidths[3] }]}>{eq.patrimony || "—"}</Text>
          <Text style={[styles.tableCell, { width: colWidths[4] }]}>{eq.serialNumber || "—"}</Text>
          <Text style={[styles.tableCell, { width: colWidths[5] }]}>{eq.criticality}</Text>
          <Text style={[styles.tableCell, { width: colWidths[6] }]}>{eq.status}</Text>
        </View>
      ))}
    </View>
  );
}

export function PgtsDocument(props: PgtsDocumentProps) {
  const {
    hospitalName,
    cnpj,
    generatedByName,
    generatedAt,
    sections,
    equipments,
    equipmentSummary,
    maintenanceSummary,
    trainingSummary,
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header hospitalName={hospitalName} />
        <Footer />

        {/* Cover */}
        <View style={{ marginTop: 40, marginBottom: 30 }}>
          <Text style={styles.title}>
            Plano de Gerenciamento de{"\n"}Tecnologias em Sa{"\u00fa"}de
          </Text>
          <Text style={styles.subtitle}>{hospitalName}</Text>
          <Text style={[styles.subtitle, { fontSize: 9 }]}>
            Conforme RDC n{"\u00ba"} 509/2021 {"\u2014"} Anvisa
          </Text>
          <Text style={[styles.subtitle, { fontSize: 8, marginTop: 8 }]}>
            Gerado em {generatedAt} por {generatedByName}
          </Text>
        </View>

        {/* Section 1 — Identification */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.identificacao}</Text>
        <View style={styles.infoBox}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: "60%" }}>
              <Text style={styles.infoLabel}>Estabelecimento</Text>
              <Text style={styles.infoValue}>{hospitalName}</Text>
            </View>
            <View style={{ width: "35%" }}>
              <Text style={styles.infoLabel}>CNPJ</Text>
              <Text style={styles.infoValue}>{cnpj}</Text>
            </View>
          </View>
        </View>
        {sections.identificacao && (
          <Text style={styles.sectionText}>{sections.identificacao}</Text>
        )}

        {/* Section 2 — Objective */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.objetivo}</Text>
        <Text style={styles.sectionText}>
          {sections.objetivo || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 3 — Organizational Structure */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.estrutura_organizacional}</Text>
        <Text style={styles.sectionText}>
          {sections.estrutura_organizacional || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 4 — Technology Inventory */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.inventario}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{equipmentSummary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: "#dc2626" }]}>
              {equipmentSummary.critA}
            </Text>
            <Text style={styles.summaryLabel}>Criticidade A</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: "#f59e0b" }]}>
              {equipmentSummary.critB}
            </Text>
            <Text style={styles.summaryLabel}>Criticidade B</Text>
          </View>
        </View>
        {equipments.length > 0 && <EquipmentTable equipments={equipments} />}
        {sections.inventario && (
          <Text style={[styles.sectionText, { marginTop: 8 }]}>{sections.inventario}</Text>
        )}

        {/* Section 5 — Management Steps */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.etapas_gerenciamento}</Text>
        <View style={[styles.summaryRow, { marginBottom: 10 }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{maintenanceSummary.preventivas}</Text>
            <Text style={styles.summaryLabel}>Preventivas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{maintenanceSummary.calibracoes}</Text>
            <Text style={styles.summaryLabel}>Calibra{"\u00e7\u00f5"}es</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{maintenanceSummary.tse}</Text>
            <Text style={styles.summaryLabel}>TSE</Text>
          </View>
        </View>
        <Text style={styles.sectionText}>
          {sections.etapas_gerenciamento || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 6 — Risk Management */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.gerenciamento_riscos}</Text>
        <Text style={styles.sectionText}>
          {sections.gerenciamento_riscos || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 7 — Traceability */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.rastreabilidade}</Text>
        <Text style={styles.sectionText}>
          {sections.rastreabilidade || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 8 — Training */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.capacitacao}</Text>
        <View style={[styles.summaryRow, { marginBottom: 10 }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{trainingSummary.total}</Text>
            <Text style={styles.summaryLabel}>Treinamentos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{trainingSummary.completions}</Text>
            <Text style={styles.summaryLabel}>Conclus{"\u00f5"}es</Text>
          </View>
        </View>
        <Text style={styles.sectionText}>
          {sections.capacitacao || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 9 — Physical Infrastructure */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.infraestrutura}</Text>
        <Text style={styles.sectionText}>
          {sections.infraestrutura || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 10 — Documentation */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.documentacao}</Text>
        <Text style={styles.sectionText}>
          {sections.documentacao || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 11 — Annual Evaluation */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.avaliacao_anual}</Text>
        <Text style={styles.sectionText}>
          {sections.avaliacao_anual || "Se\u00e7\u00e3o n\u00e3o preenchida."}
        </Text>

        {/* Section 12 — Annexes */}
        <Text style={styles.sectionTitle}>{SECTION_LABELS.anexos}</Text>
        <Text style={styles.sectionText}>
          {sections.anexos || "Os anexos complementares ao PGTS devem ser arquivados junto a este documento. Incluem-se certificados de calibra\u00e7\u00e3o, contratos de manuten\u00e7\u00e3o, laudos t\u00e9cnicos e demais documentos de suporte."}
        </Text>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={{ height: 60 }} />
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Respons{"\u00e1"}vel T{"\u00e9"}cnico</Text>
          <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
            {hospitalName}
          </Text>
          <Text style={[styles.signatureLabel, { marginTop: 8 }]}>
            Data: ____/____/________
          </Text>
        </View>
      </Page>
    </Document>
  );
}
