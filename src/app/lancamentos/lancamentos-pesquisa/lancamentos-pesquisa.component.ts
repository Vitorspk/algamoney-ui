import { Title } from '@angular/platform-browser';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { LazyLoadEvent, ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

import { AuthService } from './../../seguranca/auth.service';
import { ErrorHandlerService } from './../../core/error-handler.service';
import { LancamentoService, LancamentoFiltro } from './../lancamento.service';
import { LogoutService } from './../../seguranca/logout.service';
import { ExportService } from './../../core/export.service';
import { CustomValidators } from './../../shared/validators/custom-validators.service';

@Component({
  selector: 'app-lancamentos-pesquisa',
  templateUrl: './lancamentos-pesquisa.component.html',
  styleUrls: ['./lancamentos-pesquisa.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LancamentosPesquisaComponent implements OnInit {

  totalRegistros = 0;
  filtro = new LancamentoFiltro();
  lancamentos = [];
  @ViewChild('tabela') grid;
  carregando = false;
  excluindo = false;

  formulario: FormGroup;

  constructor(
    private lancamentoService: LancamentoService,
    public auth: AuthService,
    private errorHandler: ErrorHandlerService,
    private messageService: MessageService,
    private confirmation: ConfirmationService,
    private title: Title,
    private router: Router,
    private logoutService: LogoutService,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.title.setTitle('Pesquisa de lançamentos');
    this.configurarFormulario();
  }

  configurarFormulario() {
    this.formulario = this.formBuilder.group({
      descricao: [null, [Validators.minLength(3), CustomValidators.noWhitespace()]],
      dataVencimentoInicio: [null, [CustomValidators.notFutureDate()]],
      dataVencimentoFim: [null, [CustomValidators.notFutureDate()]]
    }, {
      validators: [CustomValidators.dateRange('dataVencimentoInicio', 'dataVencimentoFim')]
    });
  }

  get descricaoInvalida(): boolean {
    const campo = this.formulario.get('descricao');
    return !!(campo?.invalid && campo?.touched);
  }

  get dateRangeInvalido(): boolean {
    return !!(this.formulario.hasError('dateRange') &&
             this.formulario.get('dataVencimentoInicio')?.touched &&
             this.formulario.get('dataVencimentoFim')?.touched);
  }

  pesquisar(pagina = 0) {
    this.filtro.pagina = pagina;
    this.filtro.descricao = this.formulario.get('descricao')?.value;
    this.filtro.dataVencimentoInicio = this.formulario.get('dataVencimentoInicio')?.value;
    this.filtro.dataVencimentoFim = this.formulario.get('dataVencimentoFim')?.value;

    this.carregando = true;
    this.cdr.markForCheck();

    this.lancamentoService.pesquisar(this.filtro)
      .then(resultado => {
        this.totalRegistros = resultado.total;
        this.lancamentos = resultado.lancamentos;
        this.cdr.markForCheck();
      })
      .catch(erro => this.errorHandler.handle(erro))
      .finally(() => {
        this.carregando = false;
        this.cdr.markForCheck();
      });
  }

  aoMudarPagina(event: LazyLoadEvent) {
    const pagina = event.first / event.rows;
    this.pesquisar(pagina);
  }

  confirmarExclusao(lancamento: any) {
    this.confirmation.confirm({
      message: 'Tem certeza que deseja excluir este lançamento?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.excluir(lancamento);
      }
    });
  }

  excluir(lancamento: any) {
    this.excluindo = true;
    this.cdr.markForCheck();

    this.lancamentoService.excluir(lancamento.codigo)
      .then(() => {
        if (this.grid.first === 0) {
          this.pesquisar();
        } else {
          this.grid.first = 0;
        }

        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Lançamento excluído com sucesso!' });
      })
      .catch(erro => this.errorHandler.handle(erro))
      .finally(() => {
        this.excluindo = false;
        this.cdr.markForCheck();
      });
  }

  editar(codigo: number) {
    this.router.navigate(['/lancamentos', codigo]);
  }

  logout() {
    this.logoutService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(erro => this.errorHandler.handle(erro));
  }

  exportarExcel() {
    const dadosExportacao = this.lancamentos.map(lanc => ({
      'Pessoa': lanc.pessoa,
      'Descrição': lanc.descricao,
      'Vencimento': this.exportService.formatDate(lanc.dataVencimento),
      'Pagamento': this.exportService.formatDate(lanc.dataPagamento),
      'Valor': this.exportService.formatCurrency(lanc.valor),
      'Tipo': lanc.tipo
    }));

    this.exportService.exportToExcel(dadosExportacao, 'lancamentos', 'Lançamentos');
  }

  exportarCSV() {
    const dadosExportacao = this.lancamentos.map(lanc => ({
      'Pessoa': lanc.pessoa,
      'Descrição': lanc.descricao,
      'Vencimento': this.exportService.formatDate(lanc.dataVencimento),
      'Pagamento': this.exportService.formatDate(lanc.dataPagamento),
      'Valor': this.exportService.formatCurrency(lanc.valor),
      'Tipo': lanc.tipo
    }));

    this.exportService.exportToCSV(dadosExportacao, 'lancamentos');
  }

  exportarPDF() {
    const colunas = [
      { header: 'Pessoa', dataKey: 'pessoa' },
      { header: 'Descrição', dataKey: 'descricao' },
      { header: 'Vencimento', dataKey: 'vencimento' },
      { header: 'Pagamento', dataKey: 'pagamento' },
      { header: 'Valor', dataKey: 'valor' },
      { header: 'Tipo', dataKey: 'tipo' }
    ];

    const dadosExportacao = this.lancamentos.map(lanc => ({
      pessoa: lanc.pessoa,
      descricao: lanc.descricao,
      vencimento: this.exportService.formatDate(lanc.dataVencimento),
      pagamento: this.exportService.formatDate(lanc.dataPagamento),
      valor: this.exportService.formatCurrency(lanc.valor),
      tipo: lanc.tipo
    }));

    this.exportService.exportToPDF(dadosExportacao, colunas, 'lancamentos', 'Relatório de Lançamentos');
  }

}
