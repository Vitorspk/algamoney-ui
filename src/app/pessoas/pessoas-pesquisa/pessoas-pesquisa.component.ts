import { Title } from '@angular/platform-browser';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { LazyLoadEvent, ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

import { ErrorHandlerService } from './../../core/error-handler.service';
import { PessoaFiltro, PessoaService } from './../pessoa.service';
import { LogoutService } from './../../seguranca/logout.service';
import { ExportService } from './../../core/export.service';
import { CustomValidators } from './../../shared/validators/custom-validators.service';

@Component({
  selector: 'app-pessoas-pesquisa',
  templateUrl: './pessoas-pesquisa.component.html',
  styleUrls: ['./pessoas-pesquisa.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PessoasPesquisaComponent implements OnInit {

  totalRegistros = 0;
  filtro = new PessoaFiltro();
  pessoas = [];
  @ViewChild('tabela') grid;
  carregando = false;
  excluindo = false;

  formulario: FormGroup;

  constructor(
    private pessoaService: PessoaService,
    private errorHandler: ErrorHandlerService,
    private confirmation: ConfirmationService,
    private messageService: MessageService,
    private title: Title,
    private router: Router,
    private logoutService: LogoutService,
    private exportService: ExportService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.title.setTitle('Pesquisa de pessoas');
    this.configurarFormulario();
  }

  configurarFormulario() {
    this.formulario = this.formBuilder.group({
      nome: [null, [Validators.minLength(3), CustomValidators.noWhitespace(), CustomValidators.onlyLetters()]]
    });
  }

  get nomeInvalido(): boolean {
    const campo = this.formulario.get('nome');
    return !!(campo?.invalid && campo?.touched);
  }

  pesquisar(pagina = 0) {
    this.filtro.pagina = pagina;
    this.filtro.nome = this.formulario.get('nome')?.value;

    this.carregando = true;
    this.cdr.markForCheck();

    this.pessoaService.pesquisar(this.filtro)
      .then(resultado => {
        this.totalRegistros = resultado.total;
        this.pessoas = resultado.pessoas;
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

  confirmarExclusao(pessoa: any) {
    this.confirmation.confirm({
      message: 'Tem certeza que deseja excluir esta pessoa?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.excluir(pessoa);
      }
    });
  }

  excluir(pessoa: any) {
    this.excluindo = true;
    this.cdr.markForCheck();

    this.pessoaService.excluir(pessoa.codigo)
      .then(() => {
        if (this.grid.first === 0) {
          this.pesquisar();
        } else {
          this.grid.first = 0;
        }

        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Pesssoa excluída com sucesso!' });
      })
      .catch(erro => this.errorHandler.handle(erro))
      .finally(() => {
        this.excluindo = false;
        this.cdr.markForCheck();
      });
  }

  alternarStatus(pessoa: any): void {
    const novoStatus = !pessoa.ativo;

    this.pessoaService.mudarStatus(pessoa.codigo, novoStatus)
      .then(() => {
        const acao = novoStatus ? 'ativada' : 'desativada';

        pessoa.ativo = novoStatus;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Pessoa ${acao} com sucesso!` });
        this.cdr.markForCheck();
      })
      .catch(erro => this.errorHandler.handle(erro));
  }

  editar(codigo: number) {
    this.router.navigate(['/pessoas', codigo]);
  }

  logout() {
    this.logoutService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(erro => this.errorHandler.handle(erro));
  }

  exportarExcel() {
    const dadosExportacao = this.pessoas.map(pes => ({
      'Nome': pes.nome,
      'Cidade': pes.endereco.cidade,
      'Estado': pes.endereco.estado,
      'Status': pes.ativo ? 'Ativo' : 'Inativo'
    }));

    this.exportService.exportToExcel(dadosExportacao, 'pessoas', 'Pessoas');
  }

  exportarCSV() {
    const dadosExportacao = this.pessoas.map(pes => ({
      'Nome': pes.nome,
      'Cidade': pes.endereco.cidade,
      'Estado': pes.endereco.estado,
      'Status': pes.ativo ? 'Ativo' : 'Inativo'
    }));

    this.exportService.exportToCSV(dadosExportacao, 'pessoas');
  }

  exportarPDF() {
    const colunas = [
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Cidade', dataKey: 'cidade' },
      { header: 'Estado', dataKey: 'estado' },
      { header: 'Status', dataKey: 'status' }
    ];

    const dadosExportacao = this.pessoas.map(pes => ({
      nome: pes.nome,
      cidade: pes.endereco.cidade,
      estado: pes.endereco.estado,
      status: pes.ativo ? 'Ativo' : 'Inativo'
    }));

    this.exportService.exportToPDF(dadosExportacao, colunas, 'pessoas', 'Relatório de Pessoas');
  }

}
