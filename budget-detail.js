import React, { Component, Fragment } from "react";
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import FileSaver from "file-saver";

import {
  Row,
  Button,
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

    this.state = {
      modalAddBudgetOpen: false,
      filtered_execution: [],
      selectedMonths: [],
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
      borderColor: colors.themeColor2,
      backgroundColor: colors.themeColor2_10,
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
      borderColor: colors.themeColor1,
      backgroundColor: colors.themeColor1_10,
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

  handleMonthSelection = (selectedOptions) => {
    // Actualiza el estado con los meses seleccionados por el usuario
    this.setState({ selectedMonths: selectedOptions });

    // Obtén los valores de los meses seleccionados
    const selectedMonthValues = selectedOptions.map((option) => option.value);

    // Crea un nuevo conjunto de datos para el gráfico
    const newDatasets = this.state.barChartData.datasets.map((dataset) => {
      const newData = [...dataset.data]; // Copia los datos actuales del dataset

      // Imprime el mes seleccionado en la consola
      console.log("Meses seleccionados:", selectedMonthValues);


      // Rellena con ceros para todos los meses
      for (let i = 1; i <= 12; i++) {
        if (!selectedMonthValues.includes(i)) {
          newData[i - 1] = 0;
        }
      }

      return {
        ...dataset,
        data: newData,
      };
    });

    // Actualiza el estado del gráfico con los nuevos datasets
    this.setState({
      barChartData: {
        ...this.state.barChartData,
        datasets: newDatasets,
      },
    });
  };

  downloadChartImage = () => {
    const chartContainer = document.querySelector(".chart-container"); // Reemplaza ".chart-container" con el selector correcto de tu contenedor de gráfico
    if (chartContainer) {
      html2canvas(chartContainer).then(function (canvas) {
        canvas.toBlob(function (blob) {
          saveAs(blob, "chart.png"); // Cambia "chart.png" al nombre de archivo que desees
        });
      });
    }
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
                      <BarChart
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
                    <Colxx xxs="2">
                      <Button color="primary" block className="mb-2" onClick={() => this.downloadChartImage()}> Descargar gráfico </Button>
                    </Colxx>
                  </CardBody>
                </Card>
              </Colxx>
            </Row>
            <Row>

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
                              borderColor: [colors.themeColor1, colors.themeColor2, colors.themeColor3],
                              backgroundColor: [colors.themeColor1_10, colors.themeColor2_10, colors.themeColor3_10],
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
                              <Select
                                components={{ Input: CustomSelectInput }}
                                className="react-select"
                                classNamePrefix="react-select"
                                name="form-field-name"
                                placeholder="Seleccionar..."
                                isMulti={true} // Esto permite selecciones múltiples
                                options={[
                                  { value: 1, label: "Enero" },
                                  { value: 2, label: "Febrero" },
                                  { value: 3, label: "Marzo" },
                                  { value: 4, label: "Abril" },
                                  { value: 5, label: "Mayo" },
                                  { value: 6, label: "Junio" },
                                  { value: 7, label: "Julio" },
                                  { value: 8, label: "Agosto" },
                                  { value: 9, label: "Septiembre" },
                                  { value: 10, label: "Octubre" },
                                  { value: 11, label: "Noviembre" },
                                  { value: 12, label: "Diciembre" },
                                ]}
                                value={this.state.selectedMonths} // Debes mantener un estado para las selecciones del usuario
                                onChange={this.handleMonthSelection} // Un manejador de eventos para actualizar las selecciones
                              />

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
