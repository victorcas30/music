import React, { Component, Fragment, useImperativeHandle, useRef } from "react";

import {
  Row,
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

import { connect } from "react-redux";
import numeral from "numeral";

//import IntlMessages from "../../helpers/IntlMessages";
import Select from "react-select";
import CustomSelectInput from "../../components/common/CustomSelectInput";
import { NotificationManager } from "../../components/common/react-notifications";

import { Colxx, Separator } from "../../components/common/CustomBootstrap";
import { BarChart, PieChart } from "../../components/charts";
import Chart from "chart.js/auto";
import { toBlob } from "blob-util";
import ChartjsToImage from "chartjs-to-image";
import { Bar } from "react-chartjs-2"; // Importa el componente Bar de react-chartjs-2
import html2canvas from "html2canvas"; // Importa la biblioteca html2canvas
import FileSaver from "file-saver";



import Breadcrumb from "../../containers/navs/Breadcrumb";
import { ReactTableWithPaginationCard } from "../../containers/ui/ReactTableCards";

import {
  getAccountCategories,
  getBudgetDetail,
  updateBudget,
  getBudgetCategoryMonthExecuted,
} from "../../redux/api2/actions";

import { ThemeColors } from "../../helpers/ThemeColors";
import IntlMessages from "../../helpers/IntlMessages";
import AddBudget from "../../containers/pages/AddBudget";

const colors = ThemeColors();

class BudgetDetail extends Component {
  constructor(props) {
    super(props);
    this.chartRef = useRef(null);
    this.chart = new Chart(document.querySelector("#chart"));


    this.state = {
      modalAddBudgetOpen: false,
      filtered_execution: [],
      barChartData: {
        labels: [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ],

        datasets: [
          // {
          //   label: "Asignado",
          //   borderColor: colors.themeColor1,
          //   backgroundColor: colors.themeColor1_10,
          //   data: [456, 479, 324, 569, 702, 600],
          //   borderWidth: 2,
          // },
          // {
          //   label: "Ejecutado",
          //   borderColor: colors.themeColor2,
          //   backgroundColor: colors.themeColor2_10,
          //   data: [364],
          //   borderWidth: 2,
          // },
        ],
      },
    };
  }

  downloadChartImage() {
    const chartImageBase64 = this.chart.toBase64Image();

    const blob = new Blob([chartImageBase64], { type: "image/png" });

    FileSaver.saveAs(blob, "chart.png");
  }

  componentDidMount = async () => {
    await this.props.getAccountCategories(this.props.user_logged?.user.usuario, this.props.user_logged?.token);
    await this.props.getBudgetDetail(this.props.match.params.id, this.props.user_logged?.token);
    await this.props.getBudgetCategoryMonthExecuted(this.props.match.params.id, this.props.user_logged?.token);
  };

  componentDidUpdate = async (prevProps, prevState) => {
    if (prevProps !== this.props) {
      if (!this.props.loading) {
        if (prevProps.error !== this.props.error) {
          NotificationManager.error(
            this.props.error,
            "Error",
            3000,
            null,
            null,
            ""
          );
        }

        if (this.props.success) {
          await this.props.getBudgetDetail(this.props.match.params.id, this.props.user_logged?.token);
          NotificationManager.success(
            "Registro almacenado correctamente",
            "Éxito",
            3000,
            null,
            null,
            ""
          );
        }
      }
    }
  };

  toggleModal = (modal_key) => {
    this.setState({
      [modal_key]: !this.state[modal_key],
    });
  };

  handleEditBudget = (budget) => {
    this.toggleModal("modalAddBudgetOpen");
  };

  handleCategoryExecutionChange = (event) => {
    console.log("event", event);
    let filtered_execution =
      this.props.selected_budget_categories_execution.filter(
        (item) => item.category_id === event.value
      );
    console.log("filtered_execution 1", filtered_execution);

    let category_monthly_average = {
      label: "Asignado",
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      data: [],
      borderWidth: 2,
    };

    let average = parseFloat(
      this.props.selected_budget?.detail.filter(
        (item) => item.category_id === event.value
      )[0].amount_average
    );
    for (let index = 0; index < 11; index++) {
      category_monthly_average.data.push(average);
    }

    let category_executed_dataset = {
      label: "Ejecutado",
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      data: [],
      borderWidth: 2,
    };

    console.log("filtered_execution", filtered_execution);
    filtered_execution.forEach((element) => {
      category_executed_dataset.data[element.month - 1] = parseFloat(
        element.budget_amount
      );
    });

    let new_datasets = [];
    new_datasets.push(category_monthly_average);
    new_datasets.push(category_executed_dataset);
    console.log("datasets", new_datasets);
    this.setState({
      ...this.state,
      tempCategorySelected: {
        ...this.state.tempCategorySelected,
        id: event.value,
        category_name: event.label,
      },
      filtered_execution,
      barChartData: {
        ...this.state.barChartData,
        datasets: new_datasets,
      },
    });
  };
  render() {
    let select_budget_account_categories = (
      this.props?.selected_budget?.detail || []
    ).map((e) => ({
      id: e.category_id,
      label: e.category_name,
      value: e.category_id,
    }));
    let select_account_categories = this.props?.account_categories?.map(
      (e) => ({
        id: e.correlative,
        label: e.name,
        value: e.correlative,
      })
    );


    return (
      <Fragment>
        <Row>
          <Colxx xxs="12">
            <Breadcrumb heading="menu.budget-detail" match={this.props.match} />
            <div className="text-zero top-right-button-container">
              <UncontrolledDropdown>
                <DropdownToggle
                  caret
                  color="primary"
                  size="lg"
                  outline
                  className="top-right-button top-right-button-single"
                >
                  <IntlMessages id="pages.actions" />
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem
                    onClick={() =>
                      this.handleEditBudget(this.props.selected_budget)
                    }
                  >
                    Editar Presupuesto
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>

            <Separator className="mb-5" />
          </Colxx>
        </Row>

        {/* {JSON.stringify(this.props?.selected_budget_categories_execution)} */}
        {/*  {JSON.stringify(select_account_categories)} */}
        <AddBudget
          modalOpen={this.state.modalAddBudgetOpen}
          toggleModal={() => this.toggleModal("modalAddBudgetOpen")}
          onSave={(value) => this.props.updateBudget(value, this.props.user_logged.token)}
          selected_budget={this.props.selected_budget}
          select_account_categories={select_account_categories}
        />

        {this.props.loading ? (
          <div className="loading" />
        ) : (
          <>
            <Row>
              <Colxx xxs="12">
                <Card className="card d-flex mb-3">
                  <CardBody>
                    <CardTitle>
                      Presupuesto #{this.props?.selected_budget?.correlative}
                      {console.log("SIIIIIIIIIIIIIIIIIIIIU")}
                      {console.log(this.props?.selected_budget)}
                    </CardTitle>
                    <Row>
                      <Colxx>
                        <b>Año</b>
                        <h2>{this.props?.selected_budget?.year}</h2>
                      </Colxx>
                      <Colxx xxs="4">
                        <b>Nombre</b>
                        <h2>{this.props?.selected_budget?.name}</h2>
                      </Colxx>

                      <Colxx>
                        <b>Presupuestado</b>
                        <h2>
                          Q
                          {numeral(
                            this.props?.selected_budget?.amount_budget
                          ).format("0,0.00")}
                        </h2>
                      </Colxx>
                      <Colxx>
                        <b>Asignado</b>
                        <h2>
                          Q
                          {numeral(
                            this.props?.selected_budget?.amount_assigned
                          ).format("0,0.00")}
                        </h2>
                      </Colxx>
                      <Colxx>
                        <b>Ejecutado</b>
                        <h2>
                          Q
                          {numeral(
                            this.props?.selected_budget?.amount_executed
                          ).format("0,0.00")}
                        </h2>
                      </Colxx>
                      <Colxx>
                        <b>Disponible</b>
                        <h2>
                          Q
                          {numeral(
                            this.props?.selected_budget?.amount_available
                          ).format("0,0.00")}
                        </h2>
                      </Colxx>
                    </Row>
                  </CardBody>
                </Card>
              </Colxx>
            </Row>

            <Row className="mb-4">
              <Colxx xxs="12">
                <ReactTableWithPaginationCard
                  title_id="general.detail"
                  reload_data={() => { }}
                  data={this.props?.selected_budget?.detail || []}
                  defaultPageSize={20}
                  columns={[
                    {
                      Header: "#",
                      width: 4,
                      accessor: "correlative",
                      disableFilters: true,
                      canFilter: false,
                    },
                    {
                      Header: "Categoría",
                      accessor: "category_name",

                      disableFilters: true,
                      canFilter: false,
                    },
                    {
                      Header: "Asignado",
                      accessor: "amount_assigned",
                      disableFilters: true,
                      canFilter: false,
                      width: 6,
                      Cell: (props) => (
                        <span>
                          {numeral(parseFloat(props.value)).format("0,0.00")}
                        </span>
                      ),
                    },
                    {
                      Header: "Asignado Mensual",
                      accessor: "amount_average",
                      disableFilters: true,
                      canFilter: false,
                      width: 6,
                      Cell: (props) => (
                        <span>
                          {numeral(parseFloat(props.value)).format("0,0.00")}
                        </span>
                      ),
                    },
                    {
                      Header: "Ejecutado",
                      accessor: "amount_executed",
                      disableFilters: true,
                      canFilter: false,
                      width: 6,
                      Cell: (props) => (
                        <span>
                          {numeral(parseFloat(props.value)).format("0,0.00")}
                        </span>
                      ),
                    },
                    {
                      Header: "Disponible",
                      accessor: "amount_available",
                      disableFilters: true,
                      canFilter: false,
                      width: 6,
                      Cell: (props) => (
                        <span>
                          {numeral(parseFloat(props.value)).format("0,0.00")}
                        </span>
                      ),
                    },
                  ]}
                ></ReactTableWithPaginationCard>
              </Colxx>
            </Row>

            <Row className="mb-4">
              <Colxx xxs="12">
                <Card>
                  <CardBody>
                    <CardTitle>PRESUPUESTO {this.props?.selected_budget?.name}</CardTitle>
                    <div className="chart-container">
                      <BarChart ref={this.chartRef}
                        data={{
                          labels: ["Presupuestado", "Asignado", "Ejecutado"],
                          datasets: [
                            {
                              label: "Valores",
                              borderColor: [colors.themeColor1, colors.themeColor2, colors.themeColor3],
                              backgroundColor: [colors.themeColor1_10, colors.themeColor2_10, colors.themeColor3_10],
                              data: [
                                this.props?.selected_budget?.amount_budget || 0,
                                this.props?.selected_budget?.amount_assigned || 0,
                                this.props?.selected_budget?.amount_executed || 0,
                              ],
                              borderWidth: 2,
                            },
                          ],
                        }}
                      />
                    </div>
                    <button onClick={this.downloadChartImage}>Descargar gráfico</button>
                  </CardBody>
                </Card>
              </Colxx>
            </Row>

            <Row className="mb-4">
              <Colxx xxs="12">
                <Card>
                  <CardBody>
                    <CardTitle>GRÁFICO {this.props?.selected_budget?.name}</CardTitle>
                    <div className="chart-container">
                      <PieChart
                        data={{
                          labels: ["Ejecutado", "Disponible"],
                          datasets: [
                            {
                              label: "Valores",
                              backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(255, 159, 64, 0.2)',
                                'rgba(255, 205, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(201, 203, 207, 0.2)'
                              ],
                              borderColor: [
                                'rgb(255, 99, 132)',
                                'rgb(255, 159, 64)',
                                'rgb(255, 205, 86)',
                                'rgb(75, 192, 192)',
                                'rgb(54, 162, 235)',
                                'rgb(153, 102, 255)',
                                'rgb(201, 203, 207)'
                              ],
                              borderWidth: 1,
                              data: [
                                this.props?.selected_budget?.amount_executed || 0,
                                this.props?.selected_budget?.amount_available || 0,
                              ],
                              borderWidth: 2,
                            },
                          ],
                        }}
                      />
                    </div>
                  </CardBody>
                </Card>
              </Colxx>
            </Row>




            {select_budget_account_categories.length > 0 && (
              <Row className="mb-4">
                <Colxx xxs="12">
                  <Card>
                    <CardBody>
                      <CardTitle>Ejecución</CardTitle>
                      <Row>
                        <Colxx xxs="12" lg="12" className="mb-5">
                          <CardSubtitle>
                            <dl>
                              <dt>Categoría</dt>
                              <dd>
                                <Select
                                  components={{ Input: CustomSelectInput }}
                                  className="react-select"
                                  classNamePrefix="react-select"
                                  name="form-field-name"
                                  placeholder="Seleccionar..."
                                  options={
                                    select_budget_account_categories || []
                                  }
                                  value={select_budget_account_categories?.filter(
                                    (option) =>
                                      option?.id ===
                                      (this.state?.tempCategorySelected?.id ||
                                        null)
                                  )}
                                  onChange={(event) => {
                                    this.handleCategoryExecutionChange(event);
                                  }}
                                />
                              </dd>
                            </dl>
                          </CardSubtitle>
                          <div className="chart-container">
                            <BarChart data={this.state.barChartData} />
                          </div>
                        </Colxx>
                      </Row>
                    </CardBody>
                  </Card>
                </Colxx>
              </Row>
            )}
          </>
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = ({ api2 }) => {
  let {
    loading,
    error,
    success,
    user_logged,
    selected_budget,
    selected_budget_categories_execution,
    account_categories,
  } = api2;
  return {
    loading,
    error,
    success,
    user_logged,
    selected_budget,
    selected_budget_categories_execution,
    account_categories,
  };
};
export default connect(mapStateToProps, {
  getAccountCategories,
  getBudgetDetail,
  updateBudget,
  getBudgetCategoryMonthExecuted,
})(BudgetDetail);
