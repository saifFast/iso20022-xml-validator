import { Injectable } from '@angular/core';
import { SampleMessage } from '../models/sample-message';

export type { SampleMessage } from '../models/sample-message';

@Injectable({
  providedIn: 'root'
})
export class SampleMessagesService {

  private samples: SampleMessage[] = [
    {
      id: 'valid-basic',
      name: 'Valid Basic Transfer',
      description: 'A simple valid PACS.008 with single transaction',
      category: 'valid',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.003.02">
  <FIToFICstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG20260308001</MsgId>
      <CreDtTm>2026-03-08T10:30:00Z</CreDtTm>
      <NbOfTxns>1</NbOfTxns>
      <CtrlSum>1000.00</CtrlSum>
      <InitgPty>
        <Nm>Sender Bank</Nm>
        <Id>
          <OrgId>
            <BICOrBEI>SENDUS33</BICOrBEI>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT0001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxns>1</NbOfTxns>
      <CtrlSum>1000.00</CtrlSum>
      <DbtrAgt>
        <FinInstnId>
          <BICOrBEI>SENDUS33</BICOrBEI>
        </FinInstnId>
      </DbtrAgt>
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>INSTR001</InstrId>
          <EndToEndId>E2E001</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="USD">1000.00</InstdAmt>
        </Amt>
        <Dbtr>
          <Nm>John Doe</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>US89370400440618263511</IBAN>
          </Id>
        </DbtrAcct>
        <CdtrAgt>
          <FinInstnId>
            <BICOrBEI>RECEIV33</BICOrBEI>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>Jane Smith</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>US27600000000013000000</IBAN>
          </Id>
        </CdtrAcct>
      </CdtTrfTxInf>
    </PmtInf>
  </FIToFICstmrCdtTrfInitn>
</Document>`
    },
    {
      id: 'valid-multiple',
      name: 'Valid Multiple Transactions',
      description: 'PACS.008 with multiple payment instructions',
      category: 'valid',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.003.02">
  <FIToFICstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG20260308002</MsgId>
      <CreDtTm>2026-03-08T14:15:00Z</CreDtTm>
      <NbOfTxns>2</NbOfTxns>
      <CtrlSum>5500.00</CtrlSum>
      <InitgPty>
        <Nm>Global Bank AG</Nm>
        <Id>
          <OrgId>
            <BICOrBEI>DEUTDEDB</BICOrBEI>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT0002</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxns>2</NbOfTxns>
      <CtrlSum>5500.00</CtrlSum>
      <DbtrAgt>
        <FinInstnId>
          <BICOrBEI>DEUTDEDB</BICOrBEI>
        </FinInstnId>
      </DbtrAgt>
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>INSTR002</InstrId>
          <EndToEndId>E2E002</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">3000.00</InstdAmt>
        </Amt>
        <Dbtr><Nm>ABC Corporation</Nm></Dbtr>
        <DbtrAcct><Id><IBAN>DE89370400440618263511</IBAN></Id></DbtrAcct>
        <CdtrAgt><FinInstnId><BICOrBEI>BNAGDE66</BICOrBEI></FinInstnId></CdtrAgt>
        <Cdtr><Nm>XYZ GmbH</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>DE27600000000013000000</IBAN></Id></CdtrAcct>
      </CdtTrfTxInf>
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>INSTR003</InstrId>
          <EndToEndId>E2E003</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">2500.00</InstdAmt>
        </Amt>
        <Dbtr><Nm>ABC Corporation</Nm></Dbtr>
        <DbtrAcct><Id><IBAN>DE89370400440618263511</IBAN></Id></DbtrAcct>
        <CdtrAgt><FinInstnId><BICOrBEI>BALADEDE</BICOrBEI></FinInstnId></CdtrAgt>
        <Cdtr><Nm>DEF Ltd</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>DE42600000000013000001</IBAN></Id></CdtrAcct>
      </CdtTrfTxInf>
    </PmtInf>
  </FIToFICstmrCdtTrfInitn>
</Document>`
    },
    {
      id: 'invalid-missing-fields',
      name: 'Missing Required Fields',
      description: 'Invalid: Missing MsgId and CtrlSum',
      category: 'invalid',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.003.02">
  <FIToFICstmrCdtTrfInitn>
    <GrpHdr>
      <CreDtTm>2026-03-08T10:30:00Z</CreDtTm>
      <NbOfTxns>1</NbOfTxns>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT0001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <CdtTrfTxInf>
        <Amt>
          <InstdAmt Ccy="USD">1000.00</InstdAmt>
        </Amt>
      </CdtTrfTxInf>
    </PmtInf>
  </FIToFICstmrCdtTrfInitn>
</Document>`
    },
    {
      id: 'warning-invalid-iban',
      name: 'Invalid IBAN Format',
      description: 'Warning: IBAN format is incorrect',
      category: 'warning',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.003.02">
  <FIToFICstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>MSG20260308003</MsgId>
      <CreDtTm>2026-03-08T10:30:00Z</CreDtTm>
      <NbOfTxns>1</NbOfTxns>
      <CtrlSum>1000.00</CtrlSum>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT0001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxns>1</NbOfTxns>
      <CtrlSum>1000.00</CtrlSum>
      <CdtTrfTxInf>
        <Amt>
          <InstdAmt Ccy="USD">1000.00</InstdAmt>
        </Amt>
        <Dbtr><Nm>John Doe</Nm></Dbtr>
        <DbtrAcct><Id><IBAN>INVALID123</IBAN></Id></DbtrAcct>
        <Cdtr><Nm>Jane Smith</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>ALSO-INVALID</IBAN></Id></CdtrAcct>
      </CdtTrfTxInf>
    </PmtInf>
  </FIToFICstmrCdtTrfInitn>
</Document>`
    }
  ];

  getAllSamples(): SampleMessage[] {
    return this.samples;
  }

  getSampleById(id: string): SampleMessage | undefined {
    return this.samples.find(s => s.id === id);
  }

  getSamplesByCategory(category: 'valid' | 'invalid' | 'warning'): SampleMessage[] {
    return this.samples.filter(s => s.category === category);
  }

  getRandomSample(): SampleMessage {
    return this.samples[Math.floor(Math.random() * this.samples.length)];
  }
}
