--
-- PostgreSQL database dump
--

\restrict Tb7erhES0r15ksNOzcf0Docym216vSguMobVQu564u5jGzDag9KFnKeFB8xkqV3

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS house_pro;
--
-- Name: house_pro; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE house_pro WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';


\unrestrict Tb7erhES0r15ksNOzcf0Docym216vSguMobVQu564u5jGzDag9KFnKeFB8xkqV3
\connect house_pro
\restrict Tb7erhES0r15ksNOzcf0Docym216vSguMobVQu564u5jGzDag9KFnKeFB8xkqV3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: fin_accounting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_accounting (
    id integer NOT NULL,
    store_id integer NOT NULL,
    period character varying(7) NOT NULL,
    revenue numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    receivable numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    payable numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "actualIncome" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "actualExpense" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    diff numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    remark text,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_accounting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_accounting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_accounting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_accounting_id_seq OWNED BY public.fin_accounting.id;


--
-- Name: fin_arrear; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_arrear (
    id integer NOT NULL,
    "bizType" character varying(20) NOT NULL,
    "personType" character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    mobile character varying(20),
    "totalAmount" numeric(14,2) NOT NULL,
    "remainAmount" numeric(14,2) NOT NULL,
    "dueDate" date,
    status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    remark text,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_arrear_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_arrear_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_arrear_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_arrear_id_seq OWNED BY public.fin_arrear.id;


--
-- Name: fin_bill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_bill (
    id integer NOT NULL,
    store_id integer NOT NULL,
    "bizType" character varying(20) NOT NULL,
    "bizId" character varying(100),
    "billSource" character varying(50) NOT NULL,
    payer character varying(100),
    payee character varying(100),
    "dueDate" date NOT NULL,
    "paymentCount" character varying(50),
    "billPeriod" character varying(100),
    "overdueFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    amount numeric(14,2) NOT NULL,
    "actualAmount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(20) DEFAULT 'pending_receive'::character varying NOT NULL,
    salesman_id integer,
    housekeeper_id integer,
    "roomCode" character varying(100),
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_bill_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_bill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_bill_id_seq OWNED BY public.fin_bill.id;


--
-- Name: fin_business_charge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_business_charge (
    id integer NOT NULL,
    source_key character varying(150) NOT NULL,
    deal_id integer,
    property_id integer NOT NULL,
    room_id integer,
    property_name character varying(255) NOT NULL,
    direction character varying(10) NOT NULL,
    category character varying(30) NOT NULL,
    due_date date NOT NULL,
    amount numeric(14,2) NOT NULL,
    settled_amount numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    counterparty character varying(100) DEFAULT ''::character varying NOT NULL,
    remark character varying(500) DEFAULT ''::character varying NOT NULL,
    employee_id integer NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_business_charge_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_business_charge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_business_charge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_business_charge_id_seq OWNED BY public.fin_business_charge.id;


--
-- Name: fin_business_submission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_business_submission (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    period character varying(7) NOT NULL,
    snapshot jsonb NOT NULL,
    status character varying(20) DEFAULT 'submitted'::character varying NOT NULL,
    "reviewNote" character varying(500) DEFAULT ''::character varying NOT NULL,
    employee_id integer NOT NULL,
    "employeeName" character varying(50) NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    "reviewedBy" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_business_submission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_business_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_business_submission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_business_submission_id_seq OWNED BY public.fin_business_submission.id;


--
-- Name: fin_cash_account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_cash_account (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(50) NOT NULL,
    "openingBalance" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_cash_account_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_cash_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_cash_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_cash_account_id_seq OWNED BY public.fin_cash_account.id;


--
-- Name: fin_cash_entry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_cash_entry (
    id integer NOT NULL,
    "requestKey" character varying(100) NOT NULL,
    schedule_id integer,
    charge_id integer,
    "accountCode" character varying(30) NOT NULL,
    direction character varying(10) NOT NULL,
    "paymentDate" date NOT NULL,
    amount numeric(14,2) NOT NULL,
    "payerAccount" character varying(255) NOT NULL,
    payer character varying(100) NOT NULL,
    "payeeAccount" character varying(255) NOT NULL,
    payee character varying(100) NOT NULL,
    employee_id integer NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_cash_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_cash_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_cash_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_cash_entry_id_seq OWNED BY public.fin_cash_entry.id;


--
-- Name: fin_contract_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_contract_schedule (
    id integer NOT NULL,
    deal_id integer NOT NULL,
    property_id integer NOT NULL,
    "propertyName" character varying(255) NOT NULL,
    direction character varying(10) NOT NULL,
    sequence integer NOT NULL,
    "dueDate" date NOT NULL,
    "periodStart" date NOT NULL,
    "periodEnd" date NOT NULL,
    amount numeric(14,2) NOT NULL,
    "settledAmount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    employee_id integer NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_contract_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_contract_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_contract_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_contract_schedule_id_seq OWNED BY public.fin_contract_schedule.id;


--
-- Name: fin_flow; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_flow (
    id integer NOT NULL,
    bill_id integer,
    store_id integer NOT NULL,
    amount numeric(14,2) NOT NULL,
    direction character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "isRed" boolean DEFAULT false NOT NULL,
    cashier_id integer,
    audited boolean DEFAULT false NOT NULL,
    "bizType" character varying(100),
    "paymentType" character varying(30),
    "occurredOn" date,
    remark character varying(255),
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_flow_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_flow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_flow_id_seq OWNED BY public.fin_flow.id;


--
-- Name: fin_income_cost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_income_cost (
    id integer NOT NULL,
    store_id integer NOT NULL,
    period character varying(7) NOT NULL,
    "rentIncome" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "depositIncome" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "energyIncome" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "otherIncome" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "rentCost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "energyCost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "decorateCost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "laborCost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "otherCost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "totalIncome" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "totalCost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_income_cost_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_income_cost_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_income_cost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_income_cost_id_seq OWNED BY public.fin_income_cost.id;


--
-- Name: fin_invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_invoice (
    id integer NOT NULL,
    "applySource" character varying(50) NOT NULL,
    "buyerName" character varying(200) NOT NULL,
    "buyerTaxNo" character varying(50),
    "amountWithoutTax" numeric(14,2) NOT NULL,
    "taxAmount" numeric(14,2) NOT NULL,
    "amountWithTax" numeric(14,2) NOT NULL,
    remark text,
    issuer character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    handler_id integer,
    "handleTime" date,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_invoice_id_seq OWNED BY public.fin_invoice.id;


--
-- Name: fin_payment_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_payment_plan (
    id integer NOT NULL,
    store_id integer NOT NULL,
    "planType" character varying(20) NOT NULL,
    "billingCategory" character varying(50) NOT NULL,
    reason character varying(100) NOT NULL,
    "relatedPartyType" character varying(50),
    "relatedPartyName" character varying(100),
    "totalPeriods" integer DEFAULT 1 NOT NULL,
    "paymentInterval" character varying(50),
    "totalAmount" numeric(14,2) NOT NULL,
    "completedAmount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "auditStatus" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    auditor_id integer,
    "auditTime" date,
    remark text,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_payment_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_payment_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_payment_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_payment_plan_id_seq OWNED BY public.fin_payment_plan.id;


--
-- Name: fin_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_performance (
    id integer NOT NULL,
    store_id integer NOT NULL,
    employee_id integer NOT NULL,
    "employeeName" character varying(50) NOT NULL,
    period character varying(7) NOT NULL,
    "newHouseCount" integer DEFAULT 0 NOT NULL,
    "newCustomerCount" integer DEFAULT 0 NOT NULL,
    "showingCount" integer DEFAULT 0 NOT NULL,
    "dealCount" integer DEFAULT 0 NOT NULL,
    "totalPerformance" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    distributed numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    retained numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    transferred numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    commission numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_performance_id_seq OWNED BY public.fin_performance.id;


--
-- Name: fin_property_configuration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_property_configuration (
    id integer NOT NULL,
    property_id integer NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    adjustments jsonb DEFAULT '[]'::jsonb NOT NULL,
    employee_id integer NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fin_property_configuration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_property_configuration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_property_configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_property_configuration_id_seq OWNED BY public.fin_property_configuration.id;


--
-- Name: house_building; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_building (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    community_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_building_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_building_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_building_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_building_id_seq OWNED BY public.house_building.id;


--
-- Name: house_checkout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_checkout (
    id integer NOT NULL,
    "contractCode" character varying(50) NOT NULL,
    "tenantName" character varying(50),
    "houseInfo" character varying(200) NOT NULL,
    rental_set_id integer,
    rental_room_id integer,
    "checkoutDate" date,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "settlementAmount" numeric(12,2) DEFAULT '0'::numeric,
    expected_deposit_amount numeric(12,2),
    confirmed_at timestamp without time zone,
    completed_at timestamp without time zone,
    reason character varying(255),
    remark character varying(255),
    store_id integer NOT NULL,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_checkout_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_checkout_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_checkout_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_checkout_id_seq OWNED BY public.house_checkout.id;


--
-- Name: house_community; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_community (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    alias character varying(100),
    "cityId" integer NOT NULL,
    "districtId" integer,
    district character varying(100),
    "businessCircle" character varying(100),
    address character varying(255),
    "propertyType" character varying(100),
    supplement text,
    photos text,
    longitude numeric(10,6),
    latitude numeric(10,6),
    "buildingCount" integer DEFAULT 0 NOT NULL,
    "unitCount" integer DEFAULT 0 NOT NULL,
    "roomCount" integer DEFAULT 0 NOT NULL,
    "currentSaleCount" integer DEFAULT 0 NOT NULL,
    "currentRentCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_community_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_community_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_community_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_community_id_seq OWNED BY public.house_community.id;


--
-- Name: house_customer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_customer (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    mobile character varying(20) NOT NULL,
    "idCard" character varying(255),
    "customerType" character varying(20) NOT NULL,
    "sourceChannel" character varying(50),
    "relatedPropertyCode" character varying(100),
    "desiredDistrict" character varying(100),
    "budgetMin" numeric(14,2),
    "budgetMax" numeric(14,2),
    remark character varying(500),
    "contractEndDate" date,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    salesman_id integer,
    store_id integer,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_customer_id_seq OWNED BY public.house_customer.id;


--
-- Name: house_deal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_deal (
    id integer NOT NULL,
    contract_code character varying(50) NOT NULL,
    biz_type character varying(10) NOT NULL,
    workflow_type character varying(20) DEFAULT 'regular'::character varying NOT NULL,
    details text,
    customer_id integer,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(20),
    property_id integer NOT NULL,
    room_id integer,
    property_code character varying(50) NOT NULL,
    property_name character varying(255) NOT NULL,
    rental_appointment_id integer,
    sale_appointment_id integer,
    signed_at timestamp with time zone NOT NULL,
    amount numeric(14,2),
    deposit numeric(14,2),
    lease_start date,
    lease_end date,
    payment_method character varying(50),
    responsible_employee_id integer NOT NULL,
    responsible_employee_name character varying(50) NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    checkout_id integer,
    previous_property_status character varying(30),
    terminated_on date,
    termination_reason character varying(500),
    remark character varying(500),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_deal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_deal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_deal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_deal_id_seq OWNED BY public.house_deal.id;


--
-- Name: house_deposit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_deposit (
    id integer NOT NULL,
    "contractCode" character varying(50) NOT NULL,
    "tenantName" character varying(50),
    "houseInfo" character varying(200) NOT NULL,
    "depositAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "depositDate" date,
    "refundDate" date,
    "deductReason" character varying(255),
    store_id integer NOT NULL,
    creator_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_deposit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_deposit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_deposit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_deposit_id_seq OWNED BY public.house_deposit.id;


--
-- Name: house_floor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_floor (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    unit_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_floor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_floor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_floor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_floor_id_seq OWNED BY public.house_floor.id;


--
-- Name: house_follow_up; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_follow_up (
    id integer NOT NULL,
    biz_type character varying(50) NOT NULL,
    biz_id integer NOT NULL,
    employee_id integer NOT NULL,
    "employeeName" character varying(50) NOT NULL,
    "followType" character varying(20) NOT NULL,
    content text NOT NULL,
    status character varying(30) DEFAULT 'completed'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_follow_up_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_follow_up_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_follow_up_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_follow_up_id_seq OWNED BY public.house_follow_up.id;


--
-- Name: house_followup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_followup (
    id integer NOT NULL,
    "bizType" character varying(30) NOT NULL,
    "bizId" character varying(100) NOT NULL,
    employee_id integer NOT NULL,
    content text NOT NULL,
    "followType" character varying(30),
    "nextFollowDate" date,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_followup_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_followup_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_followup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_followup_id_seq OWNED BY public.house_followup.id;


--
-- Name: house_rental_appointment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_rental_appointment (
    id integer NOT NULL,
    rental_set_id integer NOT NULL,
    rental_room_id integer,
    customer_id integer,
    customer_name character varying(50),
    source_appointment_id integer,
    contract_code character varying(50),
    signed_at timestamp with time zone,
    property_code character varying(50) NOT NULL,
    property_name character varying(255) NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    responsible_employee_id integer NOT NULL,
    responsible_employee_name character varying(50) NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    status character varying(30) DEFAULT 'scheduled'::character varying NOT NULL,
    remark text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_rental_appointment_action; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_rental_appointment_action (
    id integer NOT NULL,
    appointment_id integer NOT NULL,
    action character varying(20) NOT NULL,
    content text NOT NULL,
    employee_id integer NOT NULL,
    employee_name character varying(50) NOT NULL,
    details jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_rental_appointment_action_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_rental_appointment_action_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_rental_appointment_action_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_rental_appointment_action_id_seq OWNED BY public.house_rental_appointment_action.id;


--
-- Name: house_rental_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_rental_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_rental_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_rental_appointment_id_seq OWNED BY public.house_rental_appointment.id;


--
-- Name: house_rental_room; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_rental_room (
    id integer NOT NULL,
    "roomNo" character varying(50) NOT NULL,
    "roomType" character varying(50),
    "privateBathroom" boolean,
    balcony boolean,
    "airConditioner" boolean,
    "interiorArea" numeric(10,2),
    orientation character varying(50),
    facilities text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "rentPrice" numeric(12,2),
    "listedPrice" numeric(12,2),
    status character varying(20) DEFAULT 'vacant'::character varying NOT NULL,
    "leaseStart" date,
    "tenantName" character varying(100),
    "tenantPhone" character varying(30),
    "tenantIdCard" character varying(255),
    "leaseEnd" date,
    "paymentMethod" character varying(50),
    "leaseTerm" character varying(50),
    "renovationProgress" character varying(50),
    "cohabitantIds" text,
    "leaseDuration" character varying(50),
    "arrearDays" integer,
    "depositAmount" numeric(12,2),
    "paymentStatus" character varying(20),
    tenant_id integer,
    creator_id integer NOT NULL,
    set_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    payment_dates jsonb
);


--
-- Name: house_rental_room_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_rental_room_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_rental_room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_rental_room_id_seq OWNED BY public.house_rental_room.id;


--
-- Name: house_rental_set; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_rental_set (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    "bizType" character varying(20) NOT NULL,
    community_id integer NOT NULL,
    address character varying(100) NOT NULL,
    building character varying(50) NOT NULL,
    unit character varying(50) NOT NULL,
    floor character varying(50),
    "totalFloor" integer,
    "roomNo" character varying(50) NOT NULL,
    layout character varying(50) NOT NULL,
    "buildingArea" numeric(12,2),
    "interiorArea" numeric(12,2),
    "businessCircle" character varying(100),
    district character varying(100),
    "propertyType" character varying(30),
    orientation character varying(20),
    elevator character varying(10),
    decoration character varying(20),
    "sourceChannel" character varying(50),
    tags text,
    description text,
    title character varying(255),
    "communityIntro" text,
    "nearbySchool" text,
    "taxDescription" text,
    advantages text,
    facilities text,
    "landlordRent" numeric(12,2),
    "landlordDeposit" numeric(12,2) DEFAULT '0'::numeric,
    "landlordName" character varying(100),
    "landlordPhone" character varying(30),
    "landlordPhoneBackup" character varying(255),
    "landlordRemark" text,
    "emergencyContacts" text,
    "viewingTime" character varying(50),
    "viewingTimeAlt" character varying(50),
    "followUpContent" text,
    images text,
    "landlordIdCard" character varying(255),
    "landlordBankCard" character varying(255),
    "landlordBankName" character varying(100),
    "tenantName" character varying(100),
    "tenantPhone" character varying(30),
    "tenantIdCard" character varying(255),
    "tenantPaymentMethod" character varying(50),
    deposit numeric(12,2) DEFAULT '0'::numeric,
    rent numeric(12,2) DEFAULT '0'::numeric,
    "leaseStart" date,
    "leaseEnd" date,
    "landlordPaymentMethod" character varying(50),
    "leaseTerm" character varying(50),
    "rentFreePeriod" character varying(50),
    free_rent_ranges jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    "operationStatus" character varying(30) DEFAULT 'normal'::character varying NOT NULL,
    "businessStatus" character varying(30),
    store_id integer NOT NULL,
    group_id integer,
    landlord_id integer,
    salesman_id integer,
    housekeeper_id integer,
    creator_id integer NOT NULL,
    is_managed boolean DEFAULT false NOT NULL,
    "tenantLeaseStart" date,
    "tenantLeaseEnd" date,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    landlord_payment_date date,
    landlord_payment_dates jsonb
);


--
-- Name: house_rental_set_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_rental_set_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_rental_set_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_rental_set_id_seq OWNED BY public.house_rental_set.id;


--
-- Name: house_room_code; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_room_code (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    floor_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_room_code_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_room_code_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_room_code_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_room_code_id_seq OWNED BY public.house_room_code.id;


--
-- Name: house_sale; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_sale (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    "propertyType" character varying(20) NOT NULL,
    community_id integer NOT NULL,
    building character varying(50) NOT NULL,
    unit character varying(50) NOT NULL,
    floor character varying(50) NOT NULL,
    "roomNo" character varying(50) NOT NULL,
    "layoutRooms" integer NOT NULL,
    "layoutHalls" integer NOT NULL,
    "layoutBathrooms" integer NOT NULL,
    "layoutBalconies" integer NOT NULL,
    "buildingArea" numeric(12,2) NOT NULL,
    "interiorArea" numeric(12,2),
    "totalFloor" integer,
    "propertyStatus" character varying(20),
    "isRentSaleCoexist" boolean DEFAULT false NOT NULL,
    "isFusion" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "isOnlyProperty" boolean DEFAULT false NOT NULL,
    "govVerifyCode" character varying(100),
    "govVerifyStatus" character varying(20),
    "quickSaleStart" date,
    "quickSaleEnd" date,
    "publishedAt" date,
    "offShelfAt" date,
    "bargainAt" date,
    "verifiedAt" date,
    "lastFollowAt" date,
    "daysWithoutFollow" integer,
    "viewingTime" character varying(50),
    "viewingTimeAlt" character varying(50),
    "vrUrl" character varying(255),
    "videoUrl" character varying(255),
    orientation character varying(20) NOT NULL,
    decoration character varying(20) NOT NULL,
    elevator character varying(10) NOT NULL,
    "buildYear" integer,
    "salePrice" numeric(14,2) NOT NULL,
    "unitPrice" numeric(12,2),
    "floorPrice" numeric(14,2),
    "downPayment" numeric(14,2),
    "monthlyPayment" numeric(14,2),
    "loanAmount" numeric(14,2),
    "taxType" character varying(20),
    "taxFees" text,
    debt numeric(14,2),
    "certificateType" character varying(20),
    "propertyRights" character varying(50),
    "propertyTerm" character varying(50),
    "certificateTerm" character varying(50),
    "acceptedPaymentMethods" character varying(100),
    "sourceChannel" character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    tags text,
    description text,
    "ownerMentality" text,
    "communityIntro" text,
    "nearbySchool" text,
    "taxDescription" text,
    advantages text,
    "ownerName" character varying(50) NOT NULL,
    "ownerIdCard" character varying(255),
    "ownerPhone" character varying(255) NOT NULL,
    "ownerPhoneBackup" character varying(255),
    "ownerRemark" text,
    "emergencyContacts" text,
    "followUpContent" text,
    maintainer_id integer,
    creator_id integer NOT NULL,
    store_id integer NOT NULL,
    status character varying(30) DEFAULT 'pre_publish'::character varying NOT NULL,
    "qualityScore" integer,
    "qualityLevel" character varying(10),
    verified boolean DEFAULT false NOT NULL,
    "isCitywideSale" boolean DEFAULT false NOT NULL,
    images text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_sale_appointment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_sale_appointment (
    id integer NOT NULL,
    sale_property_id integer NOT NULL,
    customer_id integer NOT NULL,
    customer_name character varying(100) NOT NULL,
    property_code character varying(50) NOT NULL,
    property_name character varying(255) NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    responsible_employee_id integer NOT NULL,
    responsible_employee_name character varying(50) NOT NULL,
    store_id integer NOT NULL,
    group_id integer,
    status character varying(30) DEFAULT 'scheduled'::character varying NOT NULL,
    remark character varying(500),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_sale_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_sale_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_sale_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_sale_appointment_id_seq OWNED BY public.house_sale_appointment.id;


--
-- Name: house_sale_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_sale_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_sale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_sale_id_seq OWNED BY public.house_sale.id;


--
-- Name: house_unit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.house_unit (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    building_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: house_unit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.house_unit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.house_unit_id_seq OWNED BY public.house_unit.id;


--
-- Name: refresh_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_token (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "tokenHash" character varying(64) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "revokedAt" timestamp with time zone
);


--
-- Name: refresh_token_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_token_id_seq OWNED BY public.refresh_token.id;


--
-- Name: sys_approval_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_approval_record (
    id integer NOT NULL,
    "entityType" character varying(50) NOT NULL,
    "entityId" integer NOT NULL,
    action character varying(50) NOT NULL,
    "fromStatus" character varying(50),
    "toStatus" character varying(50),
    operator_id integer NOT NULL,
    approver_id integer,
    remark text,
    result character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_approval_record_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_approval_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_approval_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_approval_record_id_seq OWNED BY public.sys_approval_record.id;


--
-- Name: sys_city; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_city (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    "parentId" integer,
    "companyId" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    company_id integer
);


--
-- Name: sys_city_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_city_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_city_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_city_id_seq OWNED BY public.sys_city.id;


--
-- Name: sys_company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_company (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_company_id_seq OWNED BY public.sys_company.id;


--
-- Name: sys_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_config (
    id integer NOT NULL,
    "configKey" character varying(100) NOT NULL,
    "configValue" text,
    description character varying(255),
    group_name character varying(50) DEFAULT 'system'::character varying NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_config_id_seq OWNED BY public.sys_config.id;


--
-- Name: sys_department; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_department (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "parentId" integer,
    store_id integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_department_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_department_id_seq OWNED BY public.sys_department.id;


--
-- Name: sys_dict; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_dict (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_dict_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_dict_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_dict_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_dict_id_seq OWNED BY public.sys_dict.id;


--
-- Name: sys_dict_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_dict_item (
    id integer NOT NULL,
    dict_code character varying(50) NOT NULL,
    value character varying(50) NOT NULL,
    label character varying(100) NOT NULL,
    "parentValue" character varying(50),
    sort integer,
    enabled boolean DEFAULT true NOT NULL,
    "isBuiltin" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_dict_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_dict_item_id_seq OWNED BY public.sys_dict_item.id;


--
-- Name: sys_employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_employee (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    mobile character varying(20) NOT NULL,
    password character varying(255) NOT NULL,
    status character varying DEFAULT 'normal'::character varying NOT NULL,
    manager_id integer,
    "entryDate" date,
    "leaveDate" date,
    "idCard" character varying(255),
    "bankCard" character varying(255),
    "bankName" character varying(100),
    avatar character varying(255),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_employee_department; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_employee_department (
    "sysEmployeeId" integer NOT NULL,
    "sysDepartmentId" integer NOT NULL
);


--
-- Name: sys_employee_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_employee_group (
    "sysEmployeeId" integer NOT NULL,
    "sysGroupId" integer NOT NULL
);


--
-- Name: sys_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_employee_id_seq OWNED BY public.sys_employee.id;


--
-- Name: sys_employee_position; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_employee_position (
    "sysEmployeeId" integer NOT NULL,
    "sysPositionId" integer NOT NULL
);


--
-- Name: sys_employee_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_employee_role (
    "sysEmployeeId" integer NOT NULL,
    "sysRoleId" integer NOT NULL
);


--
-- Name: sys_employee_store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_employee_store (
    "sysEmployeeId" integer NOT NULL,
    "sysStoreId" integer NOT NULL
);


--
-- Name: sys_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_group (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    store_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_group_id_seq OWNED BY public.sys_group.id;


--
-- Name: sys_operation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_operation_log (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    module character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    "objectType" character varying(50) NOT NULL,
    "objectId" character varying(100) NOT NULL,
    "beforeSnapshot" text,
    "afterSnapshot" text,
    ip character varying(50),
    "userAgent" character varying(255),
    result character varying DEFAULT 'success'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_operation_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_operation_log_id_seq OWNED BY public.sys_operation_log.id;


--
-- Name: sys_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_permission (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    "parentId" integer,
    module character varying(50),
    path character varying(255),
    icon character varying(50),
    sort integer,
    status character varying DEFAULT 'enabled'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_permission_id_seq OWNED BY public.sys_permission.id;


--
-- Name: sys_position; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_position (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    "defaultRoleIds" text,
    sort integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_position_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_position_id_seq OWNED BY public.sys_position.id;


--
-- Name: sys_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_role (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    "dataScope" character varying(20) DEFAULT 'self'::character varying NOT NULL,
    "assignedStores" text,
    "customScope" text,
    "isBuiltin" boolean DEFAULT false NOT NULL,
    parent_id integer,
    status character varying DEFAULT 'enabled'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_role_id_seq OWNED BY public.sys_role.id;


--
-- Name: sys_role_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_role_permission (
    "sysRoleId" integer NOT NULL,
    "sysPermissionId" integer NOT NULL
);


--
-- Name: sys_store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_store (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    city_id integer NOT NULL,
    manager_id integer,
    "groupCode" character varying,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sys_store_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_store_id_seq OWNED BY public.sys_store.id;


--
-- Name: fin_accounting id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_accounting ALTER COLUMN id SET DEFAULT nextval('public.fin_accounting_id_seq'::regclass);


--
-- Name: fin_arrear id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_arrear ALTER COLUMN id SET DEFAULT nextval('public.fin_arrear_id_seq'::regclass);


--
-- Name: fin_bill id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_bill ALTER COLUMN id SET DEFAULT nextval('public.fin_bill_id_seq'::regclass);


--
-- Name: fin_business_charge id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_business_charge ALTER COLUMN id SET DEFAULT nextval('public.fin_business_charge_id_seq'::regclass);


--
-- Name: fin_business_submission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_business_submission ALTER COLUMN id SET DEFAULT nextval('public.fin_business_submission_id_seq'::regclass);


--
-- Name: fin_cash_account id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_cash_account ALTER COLUMN id SET DEFAULT nextval('public.fin_cash_account_id_seq'::regclass);


--
-- Name: fin_cash_entry id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_cash_entry ALTER COLUMN id SET DEFAULT nextval('public.fin_cash_entry_id_seq'::regclass);


--
-- Name: fin_contract_schedule id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contract_schedule ALTER COLUMN id SET DEFAULT nextval('public.fin_contract_schedule_id_seq'::regclass);


--
-- Name: fin_flow id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_flow ALTER COLUMN id SET DEFAULT nextval('public.fin_flow_id_seq'::regclass);


--
-- Name: fin_income_cost id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_income_cost ALTER COLUMN id SET DEFAULT nextval('public.fin_income_cost_id_seq'::regclass);


--
-- Name: fin_invoice id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_invoice ALTER COLUMN id SET DEFAULT nextval('public.fin_invoice_id_seq'::regclass);


--
-- Name: fin_payment_plan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_payment_plan ALTER COLUMN id SET DEFAULT nextval('public.fin_payment_plan_id_seq'::regclass);


--
-- Name: fin_performance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_performance ALTER COLUMN id SET DEFAULT nextval('public.fin_performance_id_seq'::regclass);


--
-- Name: fin_property_configuration id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_property_configuration ALTER COLUMN id SET DEFAULT nextval('public.fin_property_configuration_id_seq'::regclass);


--
-- Name: house_building id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_building ALTER COLUMN id SET DEFAULT nextval('public.house_building_id_seq'::regclass);


--
-- Name: house_checkout id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_checkout ALTER COLUMN id SET DEFAULT nextval('public.house_checkout_id_seq'::regclass);


--
-- Name: house_community id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_community ALTER COLUMN id SET DEFAULT nextval('public.house_community_id_seq'::regclass);


--
-- Name: house_customer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_customer ALTER COLUMN id SET DEFAULT nextval('public.house_customer_id_seq'::regclass);


--
-- Name: house_deal id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_deal ALTER COLUMN id SET DEFAULT nextval('public.house_deal_id_seq'::regclass);


--
-- Name: house_deposit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_deposit ALTER COLUMN id SET DEFAULT nextval('public.house_deposit_id_seq'::regclass);


--
-- Name: house_floor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_floor ALTER COLUMN id SET DEFAULT nextval('public.house_floor_id_seq'::regclass);


--
-- Name: house_follow_up id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_follow_up ALTER COLUMN id SET DEFAULT nextval('public.house_follow_up_id_seq'::regclass);


--
-- Name: house_followup id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_followup ALTER COLUMN id SET DEFAULT nextval('public.house_followup_id_seq'::regclass);


--
-- Name: house_rental_appointment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_appointment ALTER COLUMN id SET DEFAULT nextval('public.house_rental_appointment_id_seq'::regclass);


--
-- Name: house_rental_appointment_action id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_appointment_action ALTER COLUMN id SET DEFAULT nextval('public.house_rental_appointment_action_id_seq'::regclass);


--
-- Name: house_rental_room id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_room ALTER COLUMN id SET DEFAULT nextval('public.house_rental_room_id_seq'::regclass);


--
-- Name: house_rental_set id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_set ALTER COLUMN id SET DEFAULT nextval('public.house_rental_set_id_seq'::regclass);


--
-- Name: house_room_code id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_room_code ALTER COLUMN id SET DEFAULT nextval('public.house_room_code_id_seq'::regclass);


--
-- Name: house_sale id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_sale ALTER COLUMN id SET DEFAULT nextval('public.house_sale_id_seq'::regclass);


--
-- Name: house_sale_appointment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_sale_appointment ALTER COLUMN id SET DEFAULT nextval('public.house_sale_appointment_id_seq'::regclass);


--
-- Name: house_unit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_unit ALTER COLUMN id SET DEFAULT nextval('public.house_unit_id_seq'::regclass);


--
-- Name: refresh_token id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token ALTER COLUMN id SET DEFAULT nextval('public.refresh_token_id_seq'::regclass);


--
-- Name: sys_approval_record id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_approval_record ALTER COLUMN id SET DEFAULT nextval('public.sys_approval_record_id_seq'::regclass);


--
-- Name: sys_city id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_city ALTER COLUMN id SET DEFAULT nextval('public.sys_city_id_seq'::regclass);


--
-- Name: sys_company id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_company ALTER COLUMN id SET DEFAULT nextval('public.sys_company_id_seq'::regclass);


--
-- Name: sys_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_config ALTER COLUMN id SET DEFAULT nextval('public.sys_config_id_seq'::regclass);


--
-- Name: sys_department id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_department ALTER COLUMN id SET DEFAULT nextval('public.sys_department_id_seq'::regclass);


--
-- Name: sys_dict id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict ALTER COLUMN id SET DEFAULT nextval('public.sys_dict_id_seq'::regclass);


--
-- Name: sys_dict_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_item ALTER COLUMN id SET DEFAULT nextval('public.sys_dict_item_id_seq'::regclass);


--
-- Name: sys_employee id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee ALTER COLUMN id SET DEFAULT nextval('public.sys_employee_id_seq'::regclass);


--
-- Name: sys_group id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_group ALTER COLUMN id SET DEFAULT nextval('public.sys_group_id_seq'::regclass);


--
-- Name: sys_operation_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_operation_log ALTER COLUMN id SET DEFAULT nextval('public.sys_operation_log_id_seq'::regclass);


--
-- Name: sys_permission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_permission ALTER COLUMN id SET DEFAULT nextval('public.sys_permission_id_seq'::regclass);


--
-- Name: sys_position id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_position ALTER COLUMN id SET DEFAULT nextval('public.sys_position_id_seq'::regclass);


--
-- Name: sys_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role ALTER COLUMN id SET DEFAULT nextval('public.sys_role_id_seq'::regclass);


--
-- Name: sys_store id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_store ALTER COLUMN id SET DEFAULT nextval('public.sys_store_id_seq'::regclass);


--
-- Data for Name: fin_accounting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_accounting (id, store_id, period, revenue, receivable, payable, "actualIncome", "actualExpense", diff, remark, creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_arrear; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_arrear (id, "bizType", "personType", name, mobile, "totalAmount", "remainAmount", "dueDate", status, remark, creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_bill; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_bill (id, store_id, "bizType", "bizId", "billSource", payer, payee, "dueDate", "paymentCount", "billPeriod", "overdueFee", amount, "actualAmount", status, salesman_id, housekeeper_id, "roomCode", creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_business_charge; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_business_charge (id, source_key, deal_id, property_id, room_id, property_name, direction, category, due_date, amount, settled_amount, status, counterparty, remark, employee_id, store_id, group_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fin_business_submission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_business_submission (id, type, period, snapshot, status, "reviewNote", employee_id, "employeeName", store_id, group_id, "reviewedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_cash_account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_cash_account (id, code, name, "openingBalance", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_cash_entry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_cash_entry (id, "requestKey", schedule_id, charge_id, "accountCode", direction, "paymentDate", amount, "payerAccount", payer, "payeeAccount", payee, employee_id, store_id, group_id, "createdAt") FROM stdin;
\.


--
-- Data for Name: fin_contract_schedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_contract_schedule (id, deal_id, property_id, "propertyName", direction, sequence, "dueDate", "periodStart", "periodEnd", amount, "settledAmount", status, employee_id, store_id, group_id, "createdAt") FROM stdin;
\.


--
-- Data for Name: fin_flow; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_flow (id, bill_id, store_id, amount, direction, status, "isRed", cashier_id, audited, "bizType", "paymentType", "occurredOn", remark, creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_income_cost; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_income_cost (id, store_id, period, "rentIncome", "depositIncome", "energyIncome", "otherIncome", "rentCost", "energyCost", "decorateCost", "laborCost", "otherCost", "totalIncome", "totalCost", creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_invoice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_invoice (id, "applySource", "buyerName", "buyerTaxNo", "amountWithoutTax", "taxAmount", "amountWithTax", remark, issuer, status, handler_id, "handleTime", creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_payment_plan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_payment_plan (id, store_id, "planType", "billingCategory", reason, "relatedPartyType", "relatedPartyName", "totalPeriods", "paymentInterval", "totalAmount", "completedAmount", "auditStatus", auditor_id, "auditTime", remark, creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_performance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_performance (id, store_id, employee_id, "employeeName", period, "newHouseCount", "newCustomerCount", "showingCount", "dealCount", "totalPerformance", distributed, retained, transferred, commission, creator_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fin_property_configuration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fin_property_configuration (id, property_id, items, adjustments, employee_id, store_id, group_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: house_building; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_building (id, name, community_id, "createdAt", "updatedAt") FROM stdin;
1	1 号楼	1	2026-10-18 16:43:05.424187	2026-10-18 16:43:05.424187
2	2 号楼	1	2026-10-18 16:43:05.429036	2026-10-18 16:43:05.429036
\.


--
-- Data for Name: house_checkout; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_checkout (id, "contractCode", "tenantName", "houseInfo", rental_set_id, rental_room_id, "checkoutDate", status, "settlementAmount", expected_deposit_amount, confirmed_at, completed_at, reason, remark, store_id, creator_id, "createdAt", "updatedAt") FROM stdin;
1	CO2026080001	陈租客	张江汤臣豪园 1 号楼 2 单元 802 A室	\N	\N	2026-08-31	pending	-200.00	\N	\N	\N	租期到期	\N	1	6	2026-10-18 16:43:05.497605	2026-10-18 16:43:05.497605
2	CO2026080002	刘租客	张江汤臣豪园 1 号楼 2 单元 802 C室	\N	\N	2026-08-15	confirmed	3200.00	\N	\N	\N	工作调动	\N	1	4	2026-10-18 16:43:05.497605	2026-10-18 16:43:05.497605
\.


--
-- Data for Name: house_community; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_community (id, name, alias, "cityId", "districtId", district, "businessCircle", address, "propertyType", supplement, photos, longitude, latitude, "buildingCount", "unitCount", "roomCount", "currentSaleCount", "currentRentCount", "createdAt", "updatedAt") FROM stdin;
1	张江汤臣豪园	汤臣豪园	1	1	\N	张江高科技园区	上海市浦东新区张江路 123 号	\N	\N	\N	121.600000	31.200000	10	40	1200	0	0	2026-10-18 16:43:05.415842	2026-10-18 16:43:05.415842
\.


--
-- Data for Name: house_customer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_customer (id, name, mobile, "idCard", "customerType", "sourceChannel", "relatedPropertyCode", "desiredDistrict", "budgetMin", "budgetMax", remark, "contractEndDate", status, salesman_id, store_id, creator_id, "createdAt", "updatedAt") FROM stdin;
1	陈租客	13500135001	\N	tenant	online	RENT2026080001-A	\N	\N	\N	\N	2026-12-31	active	4	1	4	2026-10-18 16:43:05.522734	2026-10-18 16:43:05.522734
2	张业主	13700137001	\N	landlord	walk_in	\N	\N	\N	\N	\N	\N	active	4	1	4	2026-10-18 16:43:05.522734	2026-10-18 16:43:05.522734
3	李违约	13900139002	\N	landlord	peer	\N	\N	\N	\N	\N	\N	active	7	2	7	2026-10-18 16:43:05.522734	2026-10-18 16:43:05.522734
\.


--
-- Data for Name: house_deal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_deal (id, contract_code, biz_type, workflow_type, details, customer_id, customer_name, customer_phone, property_id, room_id, property_code, property_name, rental_appointment_id, sale_appointment_id, signed_at, amount, deposit, lease_start, lease_end, payment_method, responsible_employee_id, responsible_employee_name, store_id, group_id, status, checkout_id, previous_property_status, terminated_on, termination_reason, remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: house_deposit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_deposit (id, "contractCode", "tenantName", "houseInfo", "depositAmount", status, "depositDate", "refundDate", "deductReason", store_id, creator_id, "createdAt", "updatedAt") FROM stdin;
1	RENT2026080001-A	陈租客	张江汤臣豪园 1 号楼 2 单元 802 A室	3200.00	pending	2026-01-01	\N	\N	1	6	2026-10-18 16:43:05.506723	2026-10-18 16:43:05.506723
2	RENT2026080001-B	王租客	张江汤臣豪园 1 号楼 2 单元 802 B室	2600.00	refunded	2026-01-15	2026-07-20	\N	1	6	2026-10-18 16:43:05.506723	2026-10-18 16:43:05.506723
3	RENT2026080001-C	赵租客	张江汤臣豪园 1 号楼 2 单元 802 C室	2200.00	deducted	2026-02-01	\N	墙面损坏赔偿 500 元	1	6	2026-10-18 16:43:05.506723	2026-10-18 16:43:05.506723
\.


--
-- Data for Name: house_floor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_floor (id, name, unit_id, "createdAt", "updatedAt") FROM stdin;
1	3 层	1	2026-10-18 16:43:05.443922	2026-10-18 16:43:05.443922
2	5 层	1	2026-10-18 16:43:05.448535	2026-10-18 16:43:05.448535
3	8 层	2	2026-10-18 16:43:05.4507	2026-10-18 16:43:05.4507
4	12 层	3	2026-10-18 16:43:05.456269	2026-10-18 16:43:05.456269
\.


--
-- Data for Name: house_follow_up; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_follow_up (id, biz_type, biz_id, employee_id, "employeeName", "followType", content, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: house_followup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_followup (id, "bizType", "bizId", employee_id, content, "followType", "nextFollowDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: house_rental_appointment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_rental_appointment (id, rental_set_id, rental_room_id, customer_id, customer_name, source_appointment_id, contract_code, signed_at, property_code, property_name, scheduled_at, responsible_employee_id, responsible_employee_name, store_id, group_id, status, remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: house_rental_appointment_action; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_rental_appointment_action (id, appointment_id, action, content, employee_id, employee_name, details, "createdAt") FROM stdin;
\.


--
-- Data for Name: house_rental_room; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_rental_room (id, "roomNo", "roomType", "privateBathroom", balcony, "airConditioner", "interiorArea", orientation, facilities, "sortOrder", "rentPrice", "listedPrice", status, "leaseStart", "tenantName", "tenantPhone", "tenantIdCard", "leaseEnd", "paymentMethod", "leaseTerm", "renovationProgress", "cohabitantIds", "leaseDuration", "arrearDays", "depositAmount", "paymentStatus", tenant_id, creator_id, set_id, "createdAt", "updatedAt", payment_dates) FROM stdin;
1	A	master_bath	\N	\N	\N	\N	\N	\N	0	3200.00	3400.00	rented	\N	\N	\N	\N	2026-12-31	quarterly	1_year	\N	\N	\N	\N	3200.00	normal	1	6	1	2026-10-18 16:43:05.490263	2026-10-18 16:43:05.490263	\N
2	B	second	\N	\N	\N	\N	\N	\N	0	2600.00	2700.00	vacant	\N	\N	\N	\N	\N	quarterly	1_year	\N	\N	\N	\N	2600.00	normal	\N	6	1	2026-10-18 16:43:05.490263	2026-10-18 16:43:05.490263	\N
3	C	small	\N	\N	\N	\N	\N	\N	0	2200.00	2300.00	reserved	\N	\N	\N	\N	2026-08-31	monthly	1_year	\N	\N	\N	\N	2200.00	overdue	\N	6	1	2026-10-18 16:43:05.490263	2026-10-18 16:43:05.490263	\N
\.


--
-- Data for Name: house_rental_set; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_rental_set (id, code, "bizType", community_id, address, building, unit, floor, "totalFloor", "roomNo", layout, "buildingArea", "interiorArea", "businessCircle", district, "propertyType", orientation, elevator, decoration, "sourceChannel", tags, description, title, "communityIntro", "nearbySchool", "taxDescription", advantages, facilities, "landlordRent", "landlordDeposit", "landlordName", "landlordPhone", "landlordPhoneBackup", "landlordRemark", "emergencyContacts", "viewingTime", "viewingTimeAlt", "followUpContent", images, "landlordIdCard", "landlordBankCard", "landlordBankName", "tenantName", "tenantPhone", "tenantIdCard", "tenantPaymentMethod", deposit, rent, "leaseStart", "leaseEnd", "landlordPaymentMethod", "leaseTerm", "rentFreePeriod", free_rent_ranges, status, "operationStatus", "businessStatus", store_id, group_id, landlord_id, salesman_id, housekeeper_id, creator_id, is_managed, "tenantLeaseStart", "tenantLeaseEnd", "createdAt", "updatedAt", landlord_payment_date, landlord_payment_dates) FROM stdin;
1	RENT2026080001	shared	1	上海市浦东新区张江路 123 号	1 号楼	2 单元	\N	\N	802	3室1厅1卫	110.00	\N	\N	\N	\N	\N	\N	fine	\N	\N	\N	\N	\N	\N	\N	\N	\N	9000.00	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	2026-01-01	2027-01-01	\N	\N	\N	[]	active	normal	\N	1	1	100	4	6	6	f	\N	\N	2026-10-18 16:43:05.480433	2026-10-18 16:43:05.480433	\N	\N
\.


--
-- Data for Name: house_room_code; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_room_code (id, name, floor_id, "createdAt", "updatedAt") FROM stdin;
1	301	1	2026-10-18 16:43:05.459055	2026-10-18 16:43:05.459055
2	302	1	2026-10-18 16:43:05.459055	2026-10-18 16:43:05.459055
3	501	2	2026-10-18 16:43:05.459055	2026-10-18 16:43:05.459055
4	802	3	2026-10-18 16:43:05.459055	2026-10-18 16:43:05.459055
5	1201	4	2026-10-18 16:43:05.459055	2026-10-18 16:43:05.459055
\.


--
-- Data for Name: house_sale; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_sale (id, code, "propertyType", community_id, building, unit, floor, "roomNo", "layoutRooms", "layoutHalls", "layoutBathrooms", "layoutBalconies", "buildingArea", "interiorArea", "totalFloor", "propertyStatus", "isRentSaleCoexist", "isFusion", "isPublic", "isOnlyProperty", "govVerifyCode", "govVerifyStatus", "quickSaleStart", "quickSaleEnd", "publishedAt", "offShelfAt", "bargainAt", "verifiedAt", "lastFollowAt", "daysWithoutFollow", "viewingTime", "viewingTimeAlt", "vrUrl", "videoUrl", orientation, decoration, elevator, "buildYear", "salePrice", "unitPrice", "floorPrice", "downPayment", "monthlyPayment", "loanAmount", "taxType", "taxFees", debt, "certificateType", "propertyRights", "propertyTerm", "certificateTerm", "acceptedPaymentMethods", "sourceChannel", title, tags, description, "ownerMentality", "communityIntro", "nearbySchool", "taxDescription", advantages, "ownerName", "ownerIdCard", "ownerPhone", "ownerPhoneBackup", "ownerRemark", "emergencyContacts", "followUpContent", maintainer_id, creator_id, store_id, status, "qualityScore", "qualityLevel", verified, "isCitywideSale", images, "createdAt", "updatedAt") FROM stdin;
1	SALE2026080001	residential	1	1 号楼	1 单元	3 层	301	2	1	1	1	88.00	\N	\N	\N	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	south_north	fine	yes	2015	6800000.00	77273.00	6500000.00	\N	\N	\N	normal	\N	0.00	property	\N	\N	\N	\N	walk_in	张江汤臣豪园 2 室 2 厅 精装修	["subway","school","elevator"]	\N	\N	\N	\N	\N	\N	张业主	\N	enc:Jax4xkWfu8IZ7p0BDnenv4nNnieH4WIU2v8PR8hTYZQzU3Xf/gidaLOoQ6b/yfG57W66Hu9QXl8S2wo=	\N	\N	\N	\N	4	4	1	published	85	A	t	f	[]	2026-10-18 16:43:05.464441	2026-10-18 16:43:05.464441
2	SALE2026080002	residential	1	1 号楼	1 单元	3 层	302	3	2	2	1	128.00	\N	\N	\N	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	south_north	luxury	yes	2015	9200000.00	71875.00	9000000.00	\N	\N	\N	normal	\N	1200000.00	property	\N	\N	\N	\N	walk_in	张江汤臣豪园 3 室 2 厅 豪华装修	["subway","school","elevator"]	\N	\N	\N	\N	\N	\N	李业主	\N	enc:FjtVm5956McftBgdanNihKNqqVJtWqhAHn0JjCgKEJO06G73vNhrQaQpaQGBjTB52rYwn4ROC3BrQrg=	\N	\N	\N	\N	7	7	1	bargain	78	B	t	f	[]	2026-10-18 16:43:05.464441	2026-10-18 16:43:05.464441
3	SALE2026080003	residential	1	1 号楼	1 单元	3 层	501	1	1	1	1	58.00	\N	\N	\N	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	south_north	simple	yes	2015	4200000.00	72414.00	4100000.00	\N	\N	\N	normal	\N	0.00	property	\N	\N	\N	\N	walk_in	张江汤臣豪园 1 室 1 厅 简装	["subway","school","elevator"]	\N	\N	\N	\N	\N	\N	赵业主	\N	enc:pVDnALM9DiDX3JRf6S6gwW56OZUt47i22CMEfGuM8LIEJGnyDWlVUyLyAxoSp6vURB3mGiNatLuDIhE=	\N	\N	\N	\N	8	8	2	pre_publish	60	C	t	f	[]	2026-10-18 16:43:05.464441	2026-10-18 16:43:05.464441
\.


--
-- Data for Name: house_sale_appointment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_sale_appointment (id, sale_property_id, customer_id, customer_name, property_code, property_name, scheduled_at, responsible_employee_id, responsible_employee_name, store_id, group_id, status, remark, "createdAt") FROM stdin;
\.


--
-- Data for Name: house_unit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.house_unit (id, name, building_id, "createdAt", "updatedAt") FROM stdin;
1	1 单元	1	2026-10-18 16:43:05.432464	2026-10-18 16:43:05.432464
2	2 单元	1	2026-10-18 16:43:05.438572	2026-10-18 16:43:05.438572
3	1 单元	2	2026-10-18 16:43:05.441691	2026-10-18 16:43:05.441691
\.


--
-- Data for Name: refresh_token; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_token (id, "userId", "tokenHash", status, "expiresAt", "createdAt", "revokedAt") FROM stdin;
1	1	942b03d22c2cc9adc3231fe7c133d5e55b147c2daaaceefb43c6aa8d70b4fba1	active	2026-10-25 16:47:02.801+08	2026-10-18 16:47:02.806961+08	\N
2	1	fe8dd997af60f66b9e4d8ba191689515b435335a0e2cfd11b47a45fae68865d8	active	2026-10-25 16:49:06.088+08	2026-10-18 16:49:06.090689+08	\N
3	1	d363bbded4d5033f782310f455969e5efad38969849a88271d92c4fff5ec15da	active	2026-10-25 17:04:42.868+08	2026-10-18 17:04:42.878499+08	\N
4	1	7c69c2c7bc9abe970016b76b95b5e03d500b6ab5875e5b9795ab57554134687d	active	2026-10-25 17:08:44.045+08	2026-10-18 17:08:44.051041+08	\N
5	1	0af7805b9ea94e5d5783bac711e781f6ae3ef4fbf4ca21a8fa8d4f29058ee65c	active	2026-10-25 17:09:04.83+08	2026-10-18 17:09:04.832258+08	\N
6	1	2534e9fec69a0158062e5f076eee5c8b2b3c7ad8c663cff11d73db38b753b83f	active	2026-10-25 17:09:05.289+08	2026-10-18 17:09:05.290495+08	\N
8	1	09c4700ed34b33be6b2bf510fa156968414d9e642bf3d092e3af3cb14096c0fc	active	2026-10-25 17:09:33.5+08	2026-10-18 17:09:33.501962+08	\N
9	1	047e58e67505de63891a1cdd32effee49a3e2fb730bb54edbb0151621e404642	active	2026-10-25 17:10:45.761+08	2026-10-18 17:10:45.763153+08	\N
\.


--
-- Data for Name: sys_approval_record; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_approval_record (id, "entityType", "entityId", action, "fromStatus", "toStatus", operator_id, approver_id, remark, result, "createdAt") FROM stdin;
\.


--
-- Data for Name: sys_city; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_city (id, name, "parentId", "companyId", "createdAt", "updatedAt", company_id) FROM stdin;
1	上海	\N	1	2026-10-18 16:43:04.947185	2026-10-18 16:43:04.947185	\N
2	北京	\N	1	2026-10-18 16:43:04.955398	2026-10-18 16:43:04.955398	\N
\.


--
-- Data for Name: sys_company; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_company (id, name, status, "createdAt", "updatedAt") FROM stdin;
1	优居科技	active	2026-10-18 16:43:04.939228	2026-10-18 16:43:04.939228
\.


--
-- Data for Name: sys_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_config (id, "configKey", "configValue", description, group_name, sort, "createdAt", "updatedAt") FROM stdin;
1	system.company_name	优居科技	公司名称	system	1	2026-10-18 16:43:05.529356	2026-10-18 16:43:05.529356
2	system.page_size	20	默认分页大小	system	2	2026-10-18 16:43:05.529356	2026-10-18 16:43:05.529356
3	business.sale_approval	false	售房成交是否需要审批	business	2	2026-10-18 16:43:05.529356	2026-10-18 16:43:05.529356
4	finance.deposit_months	1	默认押金月数	finance	1	2026-10-18 16:43:05.529356	2026-10-18 16:43:05.529356
5	finance.overdue_rate	0.05	逾期罚金日利率	finance	2	2026-10-18 16:43:05.529356	2026-10-18 16:43:05.529356
6	notification.sms_enabled	true	短信通知开关	notification	1	2026-10-18 16:43:05.529356	2026-10-18 16:43:05.529356
7	notification.email_enabled	false	邮件通知开关	notification	2	2026-10-18 16:43:05.529356	2026-10-18 16:43:05.529356
\.


--
-- Data for Name: sys_department; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_department (id, name, "parentId", store_id, "createdAt", "updatedAt") FROM stdin;
1	业务部	\N	1	2026-10-18 16:43:04.972229	2026-10-18 16:43:04.972229
2	财务部	\N	1	2026-10-18 16:43:04.972229	2026-10-18 16:43:04.972229
3	销售部	\N	1	2026-10-18 16:43:04.972229	2026-10-18 16:43:04.972229
\.


--
-- Data for Name: sys_dict; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_dict (id, code, name, "createdAt", "updatedAt") FROM stdin;
1	property_type	property_type	2026-10-18 16:43:05.153721	2026-10-18 16:43:05.153721
2	decoration_level	decoration_level	2026-10-18 16:43:05.176513	2026-10-18 16:43:05.176513
3	payment_method	payment_method	2026-10-18 16:43:05.183378	2026-10-18 16:43:05.183378
4	lease_term	lease_term	2026-10-18 16:43:05.194101	2026-10-18 16:43:05.194101
5	room_type	room_type	2026-10-18 16:43:05.205427	2026-10-18 16:43:05.205427
6	room_status	room_status	2026-10-18 16:43:05.213147	2026-10-18 16:43:05.213147
7	source_channel	source_channel	2026-10-18 16:43:05.222037	2026-10-18 16:43:05.222037
8	house_status	house_status	2026-10-18 16:43:05.239367	2026-10-18 16:43:05.239367
9	customer_status	customer_status	2026-10-18 16:43:05.247549	2026-10-18 16:43:05.247549
10	house_tag	house_tag	2026-10-18 16:43:05.256986	2026-10-18 16:43:05.256986
11	identity	identity	2026-10-18 16:43:05.273871	2026-10-18 16:43:05.273871
12	billing_category	billing_category	2026-10-18 16:43:05.288977	2026-10-18 16:43:05.288977
13	plan_type	plan_type	2026-10-18 16:43:05.296356	2026-10-18 16:43:05.296356
14	ticket_status	ticket_status	2026-10-18 16:43:05.303038	2026-10-18 16:43:05.303038
15	payment_type	payment_type	2026-10-18 16:43:05.311146	2026-10-18 16:43:05.311146
16	card_type	card_type	2026-10-18 16:43:05.316728	2026-10-18 16:43:05.316728
17	biz_type	biz_type	2026-10-18 16:43:05.348696	2026-10-18 16:43:05.348696
18	orientation	orientation	2026-10-18 16:43:05.363695	2026-10-18 16:43:05.363695
19	tax_type	tax_type	2026-10-18 16:43:05.372948	2026-10-18 16:43:05.372948
20	certificate_type	certificate_type	2026-10-18 16:43:05.380204	2026-10-18 16:43:05.380204
21	checkout_status	checkout_status	2026-10-18 16:43:05.38914	2026-10-18 16:43:05.38914
22	deposit_status	deposit_status	2026-10-18 16:43:05.395846	2026-10-18 16:43:05.395846
\.


--
-- Data for Name: sys_dict_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_dict_item (id, dict_code, value, label, "parentValue", sort, enabled, "isBuiltin", "createdAt", "updatedAt") FROM stdin;
1	property_type	residential	普通住宅	\N	1	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
2	property_type	villa	别墅	\N	2	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
3	property_type	mixed	商住两用	\N	3	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
4	property_type	parking	车位	\N	4	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
5	property_type	shop	商铺	\N	5	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
6	property_type	office	写字楼	\N	6	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
7	property_type	factory	厂房	\N	7	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
8	property_type	land	土地	\N	8	t	t	2026-10-18 16:43:05.169482	2026-10-18 16:43:05.169482
9	decoration_level	rough	毛坯	\N	1	t	t	2026-10-18 16:43:05.180002	2026-10-18 16:43:05.180002
10	decoration_level	simple	清水	\N	2	t	t	2026-10-18 16:43:05.180002	2026-10-18 16:43:05.180002
11	decoration_level	normal	普装	\N	3	t	t	2026-10-18 16:43:05.180002	2026-10-18 16:43:05.180002
12	decoration_level	fine	精装	\N	4	t	t	2026-10-18 16:43:05.180002	2026-10-18 16:43:05.180002
13	decoration_level	luxury	豪装	\N	5	t	t	2026-10-18 16:43:05.180002	2026-10-18 16:43:05.180002
14	payment_method	monthly	月付	\N	1	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
15	payment_method	bi_monthly	二月付	\N	2	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
16	payment_method	quarterly	季付	\N	3	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
17	payment_method	four_month	四月付	\N	4	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
18	payment_method	half_year	半年付	\N	5	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
19	payment_method	yearly	年付	\N	6	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
20	payment_method	two_year	二年付	\N	7	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
21	payment_method	three_year	三年付	\N	8	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
22	payment_method	four_year	四年付	\N	9	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
23	payment_method	full	全额支付	\N	10	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
24	payment_method	irregular	不规则缴费	\N	11	t	t	2026-10-18 16:43:05.189219	2026-10-18 16:43:05.189219
25	lease_term	1_month	1个月	\N	1	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
26	lease_term	2_month	2个月	\N	2	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
27	lease_term	3_month	3个月	\N	3	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
28	lease_term	half_year	半年	\N	4	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
29	lease_term	1_year	1年	\N	5	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
30	lease_term	2_year	2年	\N	6	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
31	lease_term	3_year	3年	\N	7	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
32	lease_term	other	其他	\N	8	t	t	2026-10-18 16:43:05.197123	2026-10-18 16:43:05.197123
33	room_type	master	主卧	\N	1	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
34	room_type	master_bath	主卧独卫	\N	2	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
35	room_type	second	次卧	\N	3	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
36	room_type	second_bath	次卧独卫	\N	4	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
37	room_type	small	小卧	\N	5	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
38	room_type	bright_partition	明隔	\N	6	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
39	room_type	dark_partition	暗隔	\N	7	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
40	room_type	bright_partition_bath	明隔独卫	\N	8	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
41	room_type	custom	可自定义房型	\N	9	t	t	2026-10-18 16:43:05.209356	2026-10-18 16:43:05.209356
42	room_status	vacant	空	\N	1	t	t	2026-10-18 16:43:05.216044	2026-10-18 16:43:05.216044
43	room_status	rented	已租	\N	2	t	t	2026-10-18 16:43:05.216044	2026-10-18 16:43:05.216044
44	room_status	reserved	定	\N	3	t	t	2026-10-18 16:43:05.216044	2026-10-18 16:43:05.216044
45	room_status	checkout	退	\N	4	t	t	2026-10-18 16:43:05.216044	2026-10-18 16:43:05.216044
46	room_status	config	配置	\N	5	t	t	2026-10-18 16:43:05.216044	2026-10-18 16:43:05.216044
47	room_status	dirty	脏房	\N	6	t	t	2026-10-18 16:43:05.216044	2026-10-18 16:43:05.216044
48	room_status	repair	维修	\N	7	t	t	2026-10-18 16:43:05.216044	2026-10-18 16:43:05.216044
49	source_channel	58	58同城	\N	1	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
50	source_channel	soufang	搜房	\N	2	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
51	source_channel	ganji	赶集	\N	3	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
52	source_channel	baixing	百姓网	\N	4	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
53	source_channel	anjuke	安居客	\N	5	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
54	source_channel	xianyu	闲鱼	\N	6	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
55	source_channel	walk_in	上门客	\N	7	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
56	source_channel	friend	朋友介绍	\N	8	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
57	source_channel	call	来电	\N	9	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
58	source_channel	old_customer	老客户	\N	10	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
59	source_channel	peer	同行	\N	11	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
60	source_channel	online	网上联系	\N	12	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
61	source_channel	agency	中介介绍	\N	13	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
62	source_channel	ads	看到我们广告	\N	14	t	t	2026-10-18 16:43:05.226553	2026-10-18 16:43:05.226553
63	house_status	pre_publish	待发布	\N	1	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
64	house_status	published	已发布	\N	2	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
65	house_status	bargain	议价中	\N	3	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
66	house_status	not_rented	未租	\N	4	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
67	house_status	vacant	待租	\N	5	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
68	house_status	rented	已租	\N	6	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
69	house_status	checkout	已退租	\N	7	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
70	house_status	sold	已售	\N	8	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
71	house_status	pause	暂不租	\N	9	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
72	house_status	taken	已拿房成交	\N	10	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
73	house_status	signed	已签约	\N	11	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
74	house_status	deposit	已交定	\N	12	t	t	2026-10-18 16:43:05.242857	2026-10-18 16:43:05.242857
75	customer_status	not_rented	未租	\N	1	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
76	customer_status	rented	已租	\N	2	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
77	customer_status	pause	暂不租	\N	3	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
78	customer_status	no_answer	电话未接听	\N	4	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
79	customer_status	to_shared	转到合租	\N	5	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
80	customer_status	to_entire	转到整租	\N	6	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
81	customer_status	to_central	转到集中	\N	7	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
82	customer_status	deposit	已定	\N	8	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
83	customer_status	sold	已成交	\N	9	t	t	2026-10-18 16:43:05.250627	2026-10-18 16:43:05.250627
84	house_tag	subway	近地铁	\N	1	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
85	house_tag	school	学区房	\N	2	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
86	house_tag	parking	有车位	\N	3	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
87	house_tag	elevator	电梯房	\N	4	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
88	house_tag	garden	花园洋房	\N	5	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
89	house_tag	new	新上房源	\N	6	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
90	house_tag	urgent	业主急售	\N	7	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
91	house_tag	bargain	可议价	\N	8	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
92	house_tag	full_furniture	家具齐全	\N	9	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
93	house_tag	south_facing	朝南	\N	10	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
94	house_tag	north_south	南北通透	\N	11	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
95	house_tag	high_floor	高楼层	\N	12	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
96	house_tag	low_floor	低楼层	\N	13	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
97	house_tag	quiet	安静	\N	14	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
98	house_tag	central_ac	中央空调	\N	15	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
99	house_tag	floor_heating	地暖	\N	16	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
100	house_tag	fresh_air	新风系统	\N	17	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
101	house_tag	smart_home	智能家居	\N	18	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
102	house_tag	river_view	江景房	\N	19	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
103	house_tag	park_view	公园景观	\N	20	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
104	house_tag	city_view	城市景观	\N	21	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
105	house_tag	sun_room	阳光房	\N	22	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
106	house_tag	basement	带地下室	\N	23	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
107	house_tag	loft	LOFT	\N	24	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
108	house_tag	duplex	复式	\N	25	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
109	house_tag	villa	独栋别墅	\N	26	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
110	house_tag	townhouse	联排别墅	\N	27	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
111	house_tag	compound	高端小区	\N	28	t	t	2026-10-18 16:43:05.261845	2026-10-18 16:43:05.261845
112	identity	tenant	租客	\N	1	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
113	identity	landlord	房东	\N	2	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
114	identity	buyer	买家	\N	3	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
115	identity	shareholder	股东	\N	4	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
116	identity	supplier	供应商	\N	5	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
117	identity	decorator	装修公司	\N	6	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
118	identity	property	物业	\N	7	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
119	identity	other	其他	\N	8	t	t	2026-10-18 16:43:05.277426	2026-10-18 16:43:05.277426
120	billing_category	rent	租金	\N	1	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
121	billing_category	commission	佣金	\N	2	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
122	billing_category	property_fee	物业费	\N	3	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
123	billing_category	rent_deposit	房租或押金类收入	\N	4	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
124	billing_category	arrear	欠款类收入	\N	5	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
125	billing_category	other_expense	其他类支出	\N	6	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
126	billing_category	energy_income	能源费用类收入	\N	7	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
127	billing_category	energy_expense	能源费用类支出	\N	8	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
128	billing_category	unknown_income	未知收入	\N	9	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
129	billing_category	other_income	其他类收入	\N	10	t	t	2026-10-18 16:43:05.292331	2026-10-18 16:43:05.292331
130	plan_type	income	应收	\N	1	t	t	2026-10-18 16:43:05.299299	2026-10-18 16:43:05.299299
131	plan_type	expense	应支	\N	2	t	t	2026-10-18 16:43:05.299299	2026-10-18 16:43:05.299299
132	ticket_status	pending	待处理	\N	1	t	t	2026-10-18 16:43:05.307574	2026-10-18 16:43:05.307574
133	ticket_status	processing	开票中	\N	2	t	t	2026-10-18 16:43:05.307574	2026-10-18 16:43:05.307574
134	ticket_status	done	已开票	\N	3	t	t	2026-10-18 16:43:05.307574	2026-10-18 16:43:05.307574
135	ticket_status	rejected	已驳回	\N	4	t	t	2026-10-18 16:43:05.307574	2026-10-18 16:43:05.307574
136	ticket_status	failed	开票失败	\N	5	t	t	2026-10-18 16:43:05.307574	2026-10-18 16:43:05.307574
137	ticket_status	red	已冲红	\N	6	t	t	2026-10-18 16:43:05.307574	2026-10-18 16:43:05.307574
138	payment_type	wechat	微信	\N	1	t	t	2026-10-18 16:43:05.313779	2026-10-18 16:43:05.313779
139	payment_type	alipay	支付宝	\N	2	t	t	2026-10-18 16:43:05.313779	2026-10-18 16:43:05.313779
140	payment_type	bank	银行卡	\N	3	t	t	2026-10-18 16:43:05.313779	2026-10-18 16:43:05.313779
141	payment_type	cash	现金	\N	4	t	t	2026-10-18 16:43:05.313779	2026-10-18 16:43:05.313779
142	card_type	personal	对私	\N	1	t	t	2026-10-18 16:43:05.346448	2026-10-18 16:43:05.346448
143	card_type	company	对公	\N	2	t	t	2026-10-18 16:43:05.346448	2026-10-18 16:43:05.346448
144	biz_type	rent	租房	\N	1	t	t	2026-10-18 16:43:05.352794	2026-10-18 16:43:05.352794
145	biz_type	sale	售房	\N	2	t	t	2026-10-18 16:43:05.352794	2026-10-18 16:43:05.352794
146	orientation	south	南	\N	1	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
147	orientation	north	北	\N	2	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
148	orientation	east	东	\N	3	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
149	orientation	west	西	\N	4	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
150	orientation	south_north	南北	\N	5	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
151	orientation	south_west	西南	\N	6	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
152	orientation	south_east	东南	\N	7	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
153	orientation	north_west	西北	\N	8	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
154	orientation	north_east	东北	\N	9	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
155	orientation	east_west	东西	\N	10	t	t	2026-10-18 16:43:05.367051	2026-10-18 16:43:05.367051
156	tax_type	personal	个税	\N	1	t	t	2026-10-18 16:43:05.376411	2026-10-18 16:43:05.376411
157	tax_type	exempt	免税	\N	2	t	t	2026-10-18 16:43:05.376411	2026-10-18 16:43:05.376411
158	tax_type	normal	正常税	\N	3	t	t	2026-10-18 16:43:05.376411	2026-10-18 16:43:05.376411
159	tax_type	double	双税	\N	4	t	t	2026-10-18 16:43:05.376411	2026-10-18 16:43:05.376411
160	tax_type	combined	综合税	\N	5	t	t	2026-10-18 16:43:05.376411	2026-10-18 16:43:05.376411
161	certificate_type	property	房产证	\N	1	t	t	2026-10-18 16:43:05.383483	2026-10-18 16:43:05.383483
162	certificate_type	contract	购房合同	\N	2	t	t	2026-10-18 16:43:05.383483	2026-10-18 16:43:05.383483
163	certificate_type	agreement	购房协议	\N	3	t	t	2026-10-18 16:43:05.383483	2026-10-18 16:43:05.383483
164	certificate_type	other	其他	\N	4	t	t	2026-10-18 16:43:05.383483	2026-10-18 16:43:05.383483
165	checkout_status	pending	待确认	\N	1	t	t	2026-10-18 16:43:05.392912	2026-10-18 16:43:05.392912
166	checkout_status	confirmed	已确认	\N	2	t	t	2026-10-18 16:43:05.392912	2026-10-18 16:43:05.392912
167	checkout_status	completed	已完成	\N	3	t	t	2026-10-18 16:43:05.392912	2026-10-18 16:43:05.392912
168	deposit_status	pending	待退	\N	1	t	t	2026-10-18 16:43:05.398714	2026-10-18 16:43:05.398714
169	deposit_status	refunded	已退	\N	2	t	t	2026-10-18 16:43:05.398714	2026-10-18 16:43:05.398714
170	deposit_status	deducted	已扣	\N	3	t	t	2026-10-18 16:43:05.398714	2026-10-18 16:43:05.398714
\.


--
-- Data for Name: sys_employee; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_employee (id, name, mobile, password, status, manager_id, "entryDate", "leaveDate", "idCard", "bankCard", "bankName", avatar, "createdAt", "updatedAt") FROM stdin;
1	超级管理员	super_admin	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
2	王老板	boss	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
3	张店长	store_manager	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
4	李业务员	salesman	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
5	赵财务	finance	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
6	周管家	housekeeper	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
7	吴经纪人A	agent01	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
8	郑经纪人B	agent02	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
9	孙只读	readonly	$2b$10$80X5/uKJR4veYiBE0Tn5YODDwBgo.f3ZDKc4bqsH3ohR2oFNhjYtS	normal	\N	\N	\N	\N	\N	\N	\N	2026-10-18 16:43:05.116286	2026-10-18 16:43:05.116286
\.


--
-- Data for Name: sys_employee_department; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_employee_department ("sysEmployeeId", "sysDepartmentId") FROM stdin;
4	1
5	2
6	3
7	1
8	1
\.


--
-- Data for Name: sys_employee_group; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_employee_group ("sysEmployeeId", "sysGroupId") FROM stdin;
\.


--
-- Data for Name: sys_employee_position; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_employee_position ("sysEmployeeId", "sysPositionId") FROM stdin;
\.


--
-- Data for Name: sys_employee_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_employee_role ("sysEmployeeId", "sysRoleId") FROM stdin;
1	1
2	2
3	3
4	7
5	4
6	6
7	8
8	8
9	9
\.


--
-- Data for Name: sys_employee_store; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_employee_store ("sysEmployeeId", "sysStoreId") FROM stdin;
1	1
1	2
1	3
2	1
2	2
2	3
3	1
4	1
5	1
6	1
7	1
8	2
9	1
9	2
9	3
\.


--
-- Data for Name: sys_group; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_group (id, name, store_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sys_operation_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_operation_log (id, employee_id, module, action, "objectType", "objectId", "beforeSnapshot", "afterSnapshot", ip, "userAgent", result, "createdAt") FROM stdin;
1	1	system	login	auth		\N	\N	127.0.0.1	\N	success	2026-10-18 16:43:05.539288
2	4	house	sale:edit	sale_property	SALE2026080001	\N	\N	192.168.1.10	\N	success	2026-10-18 16:43:05.539288
3	6	house	renting:add	rental_room	RENT2026080001	\N	\N	192.168.1.11	\N	success	2026-10-18 16:43:05.539288
\.


--
-- Data for Name: sys_permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_permission (id, code, type, name, "parentId", module, path, icon, sort, status, "createdAt", "updatedAt") FROM stdin;
1	home	menu	首页	\N	home	/home	\N	1	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.656856
2	house	menu	房屋管理	\N	house	\N	\N	2	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.656856
10	finance	menu	财务管理	\N	finance	\N	\N	3	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.656856
18	system	menu	系统管理	\N	system	\N	\N	4	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.656856
4	house:sale	menu	售房管理	2	house	/house/sale	\N	2	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.713121
6	house:customer	menu	客户管理	2	house	/house/customer	\N	5	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.716551
7	house:community	menu	小区管理	2	house	/house/community	\N	8	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.719453
8	house:checkout	menu	退租管理	2	house	/house/checkout	\N	9	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.722059
9	house:deposit	menu	押金管理	2	house	/house/deposit	\N	10	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.724092
11	finance:deal	menu	成交管理	10	finance	/finance/deal	\N	1	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.725917
12	finance:income_cost	menu	收支成本	10	finance	/finance/income-cost	\N	4	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.727638
13	finance:performance	menu	业绩核算	10	finance	/finance/performance	\N	5	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.728991
14	finance:accounting	menu	财务管理	10	finance	/finance/accounting	\N	6	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.730269
15	finance:arrears	menu	房管房业务	10	finance	/finance/arrears	\N	7	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.731592
16	finance:plan	menu	收支计划（公司现金流）	10	finance	/finance/plan	\N	8	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.733097
17	finance:billing	menu	开票管理	10	finance	/finance/billing	\N	10	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.737145
19	system:role	menu	角色管理	18	system	/system/role	\N	1	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.739512
20	system:permission	menu	权限管理	18	system	/system/permission	\N	2	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.741247
21	system:dictionary	menu	字典管理	18	system	/system/dictionary	\N	3	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.742778
22	system:employee	menu	人员管理	18	system	/system/employee	\N	4	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.744152
24	system:log	menu	操作日志	18	system	/system/log	\N	6	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.746859
25	system:config	menu	系统配置	18	system	/system/config	\N	7	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.747968
26	system:approval	menu	审批中心	18	system	/system/approval	\N	8	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.749079
27	house:customer:appointment	action	客户约看	6	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.750271
28	house:customer:sign	action	客户签约	6	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.752673
29	house:customer:terminate	action	客户解约	6	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.754546
30	finance:income_cost:modify	action	新增/编辑记录	12	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.756447
31	finance:performance:modify	action	新增/编辑记录	13	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.757911
32	finance:accounting:modify	action	新增/编辑记录	14	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.758954
33	finance:arrears:modify	action	新增/编辑记录	15	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.759993
34	finance:plan:modify	action	设置公司期初余额	16	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.760976
35	finance:export	action	导出保留的财务报表	10	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.762112
36	renting:add	action	新建房间	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.763129
37	renting:edit	action	编辑房间	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.764112
38	renting:delete	action	删除出租房源	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.765067
39	renting:checkout	action	退房登记	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.766091
40	renting:export	action	导出	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.76779
42	renting:appointment:view	action	查看约看记录	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.77174
43	renting:appointment:follow-up	action	约看后跟进	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.773496
44	renting:appointment:sign	action	约看签约	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.774712
45	renting:appointment:recommend	action	再次推荐房源	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.775807
46	sale:add	action	新房源录入	4	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.776827
47	sale:edit	action	修改房源	4	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.777846
48	sale:delete	action	删除售房房源	4	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.77878
49	sale:changeStatus	action	上架/下架/成交	4	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.779711
50	sale:export	action	导出	4	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.780649
51	house:customer:create	action	新增客户	6	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.781575
52	house:customer:edit	action	编辑客户	6	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.782494
54	house:community:edit	action	编辑小区	7	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.785901
55	house:community:delete	action	删除小区	7	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.787795
56	finance:ticket:apply	action	开票申请	17	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.789486
57	finance:ticket:approve	action	开票审批	17	finance	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.790788
58	system:role:create	action	创建角色	19	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.79189
59	system:role:edit	action	编辑角色	19	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.79292
60	system:role:delete	action	删除角色	19	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.793864
61	system:permission:edit	action	编辑权限	20	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.794813
62	system:dictionary:edit	action	编辑字典	21	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.796079
63	system:employee:edit	action	编辑员工	22	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.797212
64	system:store:edit	action	编辑门店	23	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.79823
66	checkout:export	action	导出退租	8	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.801514
67	checkout:confirm	action	确认退租/清算	8	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.803561
68	deposit:export	action	导出押金	9	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.805243
3	house:rent	menu	租房管理	2	house	/house/rent	\N	1	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.709647
5	house:property_management	menu	房管房管理	2	house	/house/property-management	\N	3	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.714783
23	system:store	menu	门店管理	18	system	/system/store	\N	5	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.7455
41	renting:appointment:create	action	发起约看	3	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.769964
53	house:community:create	action	新增小区	7	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.783451
65	system:approval:review	action	审批处理	26	system	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.799177
69	deposit:refund	action	退还押金	9	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.806756
70	deposit:deduct	action	扣留押金	9	house	\N	\N	\N	enabled	2026-10-18 16:43:04.656856	2026-10-18 16:43:04.807748
\.


--
-- Data for Name: sys_position; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_position (id, name, code, "defaultRoleIds", sort, "createdAt", "updatedAt") FROM stdin;
1	店长	store_manager	[]	\N	2026-10-18 16:43:04.983436	2026-10-18 16:43:04.983436
2	业务员	salesman	[]	\N	2026-10-18 16:43:04.983436	2026-10-18 16:43:04.983436
3	财务专员	finance_clerk	[]	\N	2026-10-18 16:43:04.983436	2026-10-18 16:43:04.983436
4	管家	housekeeper	[]	\N	2026-10-18 16:43:04.983436	2026-10-18 16:43:04.983436
5	综合经纪人	agent	[]	\N	2026-10-18 16:43:04.983436	2026-10-18 16:43:04.983436
\.


--
-- Data for Name: sys_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_role (id, name, code, "dataScope", "assignedStores", "customScope", "isBuiltin", parent_id, status, "createdAt", "updatedAt") FROM stdin;
1	超级管理员	super_admin	company	\N	\N	t	\N	enabled	2026-10-18 16:43:04.831208	2026-10-18 16:43:04.831208
2	公司管理员	company_admin	company	\N	\N	t	\N	enabled	2026-10-18 16:43:04.859583	2026-10-18 16:43:04.859583
3	店长	store_manager	store	\N	\N	t	\N	enabled	2026-10-18 16:43:04.874867	2026-10-18 16:43:04.874867
4	财务负责人	finance_manager	company	\N	\N	t	\N	enabled	2026-10-18 16:43:04.88365	2026-10-18 16:43:04.88365
5	财务专员	finance_clerk	store	\N	\N	t	\N	enabled	2026-10-18 16:43:04.897243	2026-10-18 16:43:04.897243
6	管家	housekeeper	group	\N	\N	t	\N	enabled	2026-10-18 16:43:04.906639	2026-10-18 16:43:04.906639
7	业务员	salesman	self	\N	\N	t	\N	enabled	2026-10-18 16:43:04.913551	2026-10-18 16:43:04.913551
8	综合经纪人	agent	self	\N	\N	t	\N	enabled	2026-10-18 16:43:04.922811	2026-10-18 16:43:04.922811
9	只读账号	readonly	store	\N	\N	t	\N	enabled	2026-10-18 16:43:04.929619	2026-10-18 16:43:04.929619
\.


--
-- Data for Name: sys_role_permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_role_permission ("sysRoleId", "sysPermissionId") FROM stdin;
1	1
1	2
1	10
1	18
1	4
1	6
1	7
1	8
1	9
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	19
1	20
1	21
1	22
1	24
1	25
1	26
1	27
1	28
1	29
1	30
1	31
1	32
1	33
1	34
1	35
1	36
1	37
1	38
1	39
1	40
1	42
1	43
1	44
1	45
1	46
1	47
1	48
1	49
1	50
1	51
1	52
1	54
1	55
1	56
1	57
1	58
1	59
1	60
1	61
1	62
1	63
1	64
1	66
1	67
1	68
1	3
1	5
1	23
1	41
1	53
1	65
1	69
1	70
2	1
2	2
2	10
2	18
2	4
2	6
2	7
2	8
2	9
2	11
2	12
2	13
2	14
2	15
2	16
2	17
2	19
2	20
2	21
2	22
2	24
2	25
2	26
2	27
2	28
2	29
2	30
2	31
2	32
2	33
2	34
2	35
2	36
2	37
2	38
2	39
2	40
2	42
2	43
2	44
2	45
2	46
2	47
2	48
2	49
2	50
2	51
2	52
2	54
2	55
2	56
2	57
2	58
2	59
2	60
2	61
2	62
2	63
2	64
2	66
2	67
2	68
2	3
2	5
2	23
2	41
2	53
2	65
2	69
2	70
3	1
3	2
3	10
3	18
3	4
3	6
3	7
3	11
3	12
3	13
3	14
3	15
3	16
3	17
3	26
3	27
3	28
3	29
3	30
3	31
3	32
3	33
3	34
3	35
3	36
3	37
3	38
3	39
3	40
3	42
3	43
3	44
3	45
3	46
3	47
3	48
3	49
3	50
3	51
3	52
3	63
3	67
3	3
3	5
3	41
3	65
3	69
3	70
4	1
4	2
4	10
4	18
4	4
4	6
4	11
4	12
4	13
4	14
4	15
4	16
4	17
4	26
4	30
4	31
4	32
4	33
4	34
4	35
4	56
4	57
4	67
4	3
4	5
4	65
4	69
4	70
5	1
5	10
5	18
5	11
5	15
5	16
5	26
5	30
5	31
5	32
5	33
5	34
5	56
6	1
6	2
6	18
6	6
6	7
6	26
6	27
6	28
6	29
6	36
6	37
6	39
6	42
6	43
6	44
6	45
6	67
6	3
6	5
6	41
7	1
7	2
7	18
7	4
7	6
7	7
7	26
7	27
7	28
7	29
7	42
7	43
7	44
7	45
7	46
7	47
7	49
7	50
7	51
7	52
7	3
7	5
7	41
8	1
8	2
8	18
8	4
8	6
8	7
8	26
8	27
8	28
8	29
8	42
8	43
8	44
8	45
8	46
8	47
8	49
8	50
8	51
8	52
8	3
8	5
8	41
9	1
9	2
9	10
9	4
9	6
9	7
9	11
9	12
9	13
9	14
9	15
9	16
9	17
9	3
9	5
\.


--
-- Data for Name: sys_store; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sys_store (id, name, address, phone, city_id, manager_id, "groupCode", status, "createdAt", "updatedAt") FROM stdin;
1	张江店	上海市浦东新区张江路 1 号	021-12345678	1	\N	\N	active	2026-10-18 16:43:04.95859	2026-10-18 16:43:04.95859
2	浦东店	上海市浦东新区世纪大道 88 号	021-87654321	1	\N	\N	active	2026-10-18 16:43:04.95859	2026-10-18 16:43:04.95859
3	联洋店	上海市浦东新区丁香路 1000 号	021-11223344	1	\N	\N	active	2026-10-18 16:43:04.95859	2026-10-18 16:43:04.95859
\.


--
-- Name: fin_accounting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_accounting_id_seq', 1, false);


--
-- Name: fin_arrear_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_arrear_id_seq', 1, false);


--
-- Name: fin_bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_bill_id_seq', 1, false);


--
-- Name: fin_business_charge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_business_charge_id_seq', 1, false);


--
-- Name: fin_business_submission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_business_submission_id_seq', 1, false);


--
-- Name: fin_cash_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_cash_account_id_seq', 1, false);


--
-- Name: fin_cash_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_cash_entry_id_seq', 1, false);


--
-- Name: fin_contract_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_contract_schedule_id_seq', 1, false);


--
-- Name: fin_flow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_flow_id_seq', 1, false);


--
-- Name: fin_income_cost_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_income_cost_id_seq', 1, false);


--
-- Name: fin_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_invoice_id_seq', 1, false);


--
-- Name: fin_payment_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_payment_plan_id_seq', 1, false);


--
-- Name: fin_performance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_performance_id_seq', 1, false);


--
-- Name: fin_property_configuration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fin_property_configuration_id_seq', 1, false);


--
-- Name: house_building_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_building_id_seq', 2, true);


--
-- Name: house_checkout_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_checkout_id_seq', 2, true);


--
-- Name: house_community_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_community_id_seq', 1, true);


--
-- Name: house_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_customer_id_seq', 3, true);


--
-- Name: house_deal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_deal_id_seq', 1, false);


--
-- Name: house_deposit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_deposit_id_seq', 3, true);


--
-- Name: house_floor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_floor_id_seq', 4, true);


--
-- Name: house_follow_up_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_follow_up_id_seq', 1, false);


--
-- Name: house_followup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_followup_id_seq', 1, false);


--
-- Name: house_rental_appointment_action_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_rental_appointment_action_id_seq', 1, false);


--
-- Name: house_rental_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_rental_appointment_id_seq', 1, false);


--
-- Name: house_rental_room_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_rental_room_id_seq', 3, true);


--
-- Name: house_rental_set_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_rental_set_id_seq', 1, true);


--
-- Name: house_room_code_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_room_code_id_seq', 5, true);


--
-- Name: house_sale_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_sale_appointment_id_seq', 1, false);


--
-- Name: house_sale_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_sale_id_seq', 3, true);


--
-- Name: house_unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.house_unit_id_seq', 3, true);


--
-- Name: refresh_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_token_id_seq', 9, true);


--
-- Name: sys_approval_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_approval_record_id_seq', 1, false);


--
-- Name: sys_city_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_city_id_seq', 2, true);


--
-- Name: sys_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_company_id_seq', 1, true);


--
-- Name: sys_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_config_id_seq', 7, true);


--
-- Name: sys_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_department_id_seq', 3, true);


--
-- Name: sys_dict_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_dict_id_seq', 22, true);


--
-- Name: sys_dict_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_dict_item_id_seq', 170, true);


--
-- Name: sys_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_employee_id_seq', 9, true);


--
-- Name: sys_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_group_id_seq', 1, false);


--
-- Name: sys_operation_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_operation_log_id_seq', 3, true);


--
-- Name: sys_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_permission_id_seq', 70, true);


--
-- Name: sys_position_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_position_id_seq', 5, true);


--
-- Name: sys_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_role_id_seq', 9, true);


--
-- Name: sys_store_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sys_store_id_seq', 3, true);


--
-- Name: sys_permission PK_007ea20aaa05db860bcba9cd624; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_permission
    ADD CONSTRAINT "PK_007ea20aaa05db860bcba9cd624" PRIMARY KEY (id);


--
-- Name: fin_performance PK_00b388e022b6039b454e4335d4d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_performance
    ADD CONSTRAINT "PK_00b388e022b6039b454e4335d4d" PRIMARY KEY (id);


--
-- Name: fin_arrear PK_0ae894ffc65a37c16d4c86cc75c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_arrear
    ADD CONSTRAINT "PK_0ae894ffc65a37c16d4c86cc75c" PRIMARY KEY (id);


--
-- Name: sys_role PK_12875ba0686cf845f353704dc7b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role
    ADD CONSTRAINT "PK_12875ba0686cf845f353704dc7b" PRIMARY KEY (id);


--
-- Name: fin_payment_plan PK_1cfbf9a8cbd6337788e0866fa3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_payment_plan
    ADD CONSTRAINT "PK_1cfbf9a8cbd6337788e0866fa3b" PRIMARY KEY (id);


--
-- Name: fin_flow PK_1f2f9d8aaff029f6eea8a4ad070; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_flow
    ADD CONSTRAINT "PK_1f2f9d8aaff029f6eea8a4ad070" PRIMARY KEY (id);


--
-- Name: house_room_code PK_3026367b0d73b229b6bd6753a4e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_room_code
    ADD CONSTRAINT "PK_3026367b0d73b229b6bd6753a4e" PRIMARY KEY (id);


--
-- Name: house_follow_up PK_321d2b3d4b507c34521457a2853; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_follow_up
    ADD CONSTRAINT "PK_321d2b3d4b507c34521457a2853" PRIMARY KEY (id);


--
-- Name: sys_operation_log PK_343bc6ad1d4afdc799aa56f1a3c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_operation_log
    ADD CONSTRAINT "PK_343bc6ad1d4afdc799aa56f1a3c" PRIMARY KEY (id);


--
-- Name: sys_store PK_383a4dc6c6f9e9520e1fa1ea8c5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_store
    ADD CONSTRAINT "PK_383a4dc6c6f9e9520e1fa1ea8c5" PRIMARY KEY (id);


--
-- Name: house_floor PK_45bc3b614e1a4bae2bbb7a4b31b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_floor
    ADD CONSTRAINT "PK_45bc3b614e1a4bae2bbb7a4b31b" PRIMARY KEY (id);


--
-- Name: sys_employee_store PK_47838feb65abae2d94b7fbaf570; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_store
    ADD CONSTRAINT "PK_47838feb65abae2d94b7fbaf570" PRIMARY KEY ("sysEmployeeId", "sysStoreId");


--
-- Name: fin_cash_account PK_4d67d2567cfcb184c2f0555726c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_cash_account
    ADD CONSTRAINT "PK_4d67d2567cfcb184c2f0555726c" PRIMARY KEY (id);


--
-- Name: house_rental_room PK_503da2b4b12c76268d4347792ac; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_room
    ADD CONSTRAINT "PK_503da2b4b12c76268d4347792ac" PRIMARY KEY (id);


--
-- Name: sys_approval_record PK_582b9e6fc815434da16cdcafb6b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_approval_record
    ADD CONSTRAINT "PK_582b9e6fc815434da16cdcafb6b" PRIMARY KEY (id);


--
-- Name: house_community PK_5ee04051fc5388f00bbb3c4c2fa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_community
    ADD CONSTRAINT "PK_5ee04051fc5388f00bbb3c4c2fa" PRIMARY KEY (id);


--
-- Name: sys_position PK_64eaf925b09119c29cd39b6723e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_position
    ADD CONSTRAINT "PK_64eaf925b09119c29cd39b6723e" PRIMARY KEY (id);


--
-- Name: house_deposit PK_665c5f1b42fa219a49c77f72c64; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_deposit
    ADD CONSTRAINT "PK_665c5f1b42fa219a49c77f72c64" PRIMARY KEY (id);


--
-- Name: house_sale PK_677653cb71df578de43d7bd50e4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_sale
    ADD CONSTRAINT "PK_677653cb71df578de43d7bd50e4" PRIMARY KEY (id);


--
-- Name: house_rental_appointment_action PK_6a649f08473bbea8dffceeec9b6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_appointment_action
    ADD CONSTRAINT "PK_6a649f08473bbea8dffceeec9b6" PRIMARY KEY (id);


--
-- Name: fin_contract_schedule PK_704c8421500f7cd2e07f799f0b5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contract_schedule
    ADD CONSTRAINT "PK_704c8421500f7cd2e07f799f0b5" PRIMARY KEY (id);


--
-- Name: house_building PK_737ecbf8108b4dae8dfaa34cdd2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_building
    ADD CONSTRAINT "PK_737ecbf8108b4dae8dfaa34cdd2" PRIMARY KEY (id);


--
-- Name: sys_employee_position PK_81dedf67498d7305efef2df6f18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_position
    ADD CONSTRAINT "PK_81dedf67498d7305efef2df6f18" PRIMARY KEY ("sysEmployeeId", "sysPositionId");


--
-- Name: house_rental_set PK_85ac46f2c83cf9887be28ee78c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_set
    ADD CONSTRAINT "PK_85ac46f2c83cf9887be28ee78c3" PRIMARY KEY (id);


--
-- Name: sys_config PK_8791cee36df4c4d04a9acffed27; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_config
    ADD CONSTRAINT "PK_8791cee36df4c4d04a9acffed27" PRIMARY KEY (id);


--
-- Name: fin_invoice PK_881cf2161aa24f3a678b9e67b6b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_invoice
    ADD CONSTRAINT "PK_881cf2161aa24f3a678b9e67b6b" PRIMARY KEY (id);


--
-- Name: house_deal PK_884ed48a9a80323c90b70213f1a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_deal
    ADD CONSTRAINT "PK_884ed48a9a80323c90b70213f1a" PRIMARY KEY (id);


--
-- Name: sys_dict_item PK_88f1e2a3113ea467e938dfb8af3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_item
    ADD CONSTRAINT "PK_88f1e2a3113ea467e938dfb8af3" PRIMARY KEY (id);


--
-- Name: sys_company PK_893186308a631a5167cb25a8af3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_company
    ADD CONSTRAINT "PK_893186308a631a5167cb25a8af3" PRIMARY KEY (id);


--
-- Name: sys_employee_department PK_8d1aa9386b3f5ae93e0aa358556; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_department
    ADD CONSTRAINT "PK_8d1aa9386b3f5ae93e0aa358556" PRIMARY KEY ("sysEmployeeId", "sysDepartmentId");


--
-- Name: fin_property_configuration PK_9939db47615e46987b3ce6ddca7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_property_configuration
    ADD CONSTRAINT "PK_9939db47615e46987b3ce6ddca7" PRIMARY KEY (id);


--
-- Name: house_followup PK_a29c06c8c5f7d5dff5cd0ea13c4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_followup
    ADD CONSTRAINT "PK_a29c06c8c5f7d5dff5cd0ea13c4" PRIMARY KEY (id);


--
-- Name: fin_accounting PK_a3ca50cac285103311744c36319; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_accounting
    ADD CONSTRAINT "PK_a3ca50cac285103311744c36319" PRIMARY KEY (id);


--
-- Name: house_unit PK_a623146e3a87ead2ed93ebc795c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_unit
    ADD CONSTRAINT "PK_a623146e3a87ead2ed93ebc795c" PRIMARY KEY (id);


--
-- Name: fin_business_charge PK_af77ef4a96c182b5884b533d33c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_business_charge
    ADD CONSTRAINT "PK_af77ef4a96c182b5884b533d33c" PRIMARY KEY (id);


--
-- Name: fin_cash_entry PK_afe4829ef51c78d892086c8560a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_cash_entry
    ADD CONSTRAINT "PK_afe4829ef51c78d892086c8560a" PRIMARY KEY (id);


--
-- Name: refresh_token PK_b575dd3c21fb0831013c909e7fe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY (id);


--
-- Name: sys_role_permission PK_bc44f94e39c94b395bb85b174b9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT "PK_bc44f94e39c94b395bb85b174b9" PRIMARY KEY ("sysRoleId", "sysPermissionId");


--
-- Name: sys_city PK_bcfc7b0f495cc0cae26d85a9e99; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_city
    ADD CONSTRAINT "PK_bcfc7b0f495cc0cae26d85a9e99" PRIMARY KEY (id);


--
-- Name: sys_dict PK_c99797ac6e991ce88c288e0f235; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict
    ADD CONSTRAINT "PK_c99797ac6e991ce88c288e0f235" PRIMARY KEY (id);


--
-- Name: sys_group PK_d117e244b4613bcb97230ae93de; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_group
    ADD CONSTRAINT "PK_d117e244b4613bcb97230ae93de" PRIMARY KEY (id);


--
-- Name: fin_business_submission PK_d4d18c99f78eaf4ce3ef9c3112e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_business_submission
    ADD CONSTRAINT "PK_d4d18c99f78eaf4ce3ef9c3112e" PRIMARY KEY (id);


--
-- Name: sys_employee_role PK_d4e53c78472c0629b204857cf43; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_role
    ADD CONSTRAINT "PK_d4e53c78472c0629b204857cf43" PRIMARY KEY ("sysEmployeeId", "sysRoleId");


--
-- Name: sys_employee_group PK_d7863a46687f383edec252bcf8c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_group
    ADD CONSTRAINT "PK_d7863a46687f383edec252bcf8c" PRIMARY KEY ("sysEmployeeId", "sysGroupId");


--
-- Name: house_checkout PK_d96ec7673b65b53634f746702ef; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_checkout
    ADD CONSTRAINT "PK_d96ec7673b65b53634f746702ef" PRIMARY KEY (id);


--
-- Name: house_sale_appointment PK_dd40391c62d72c68b8fae4eb67b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_sale_appointment
    ADD CONSTRAINT "PK_dd40391c62d72c68b8fae4eb67b" PRIMARY KEY (id);


--
-- Name: fin_income_cost PK_de5f206a92cf65da1955f6dbccc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_income_cost
    ADD CONSTRAINT "PK_de5f206a92cf65da1955f6dbccc" PRIMARY KEY (id);


--
-- Name: house_customer PK_f2db941c27ac040f665ec5a8dbb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_customer
    ADD CONSTRAINT "PK_f2db941c27ac040f665ec5a8dbb" PRIMARY KEY (id);


--
-- Name: house_rental_appointment PK_f7461a5fad5992dfc10153a5f62; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_appointment
    ADD CONSTRAINT "PK_f7461a5fad5992dfc10153a5f62" PRIMARY KEY (id);


--
-- Name: sys_employee PK_f8ff3415ad8352d588092fbb4c1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee
    ADD CONSTRAINT "PK_f8ff3415ad8352d588092fbb4c1" PRIMARY KEY (id);


--
-- Name: fin_bill PK_fbb58c23b7c69c3e392043f569c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_bill
    ADD CONSTRAINT "PK_fbb58c23b7c69c3e392043f569c" PRIMARY KEY (id);


--
-- Name: sys_department PK_fd8a94152d18a42aa8ddfe48f2b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_department
    ADD CONSTRAINT "PK_fd8a94152d18a42aa8ddfe48f2b" PRIMARY KEY (id);


--
-- Name: sys_dict UQ_20870e7cf976aa11cde42bf1aed; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict
    ADD CONSTRAINT "UQ_20870e7cf976aa11cde42bf1aed" UNIQUE (code);


--
-- Name: house_rental_set UQ_50a07fa3fc5990cb48c41edeb34; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_set
    ADD CONSTRAINT "UQ_50a07fa3fc5990cb48c41edeb34" UNIQUE (code);


--
-- Name: sys_config UQ_6145c2a64c5af8d5b03edfdec63; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_config
    ADD CONSTRAINT "UQ_6145c2a64c5af8d5b03edfdec63" UNIQUE ("configKey");


--
-- Name: sys_position UQ_72715d6b9b541a9bf935df2ad73; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_position
    ADD CONSTRAINT "UQ_72715d6b9b541a9bf935df2ad73" UNIQUE (code);


--
-- Name: sys_position UQ_aa1889faa7e4f62891e7f9cad94; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_position
    ADD CONSTRAINT "UQ_aa1889faa7e4f62891e7f9cad94" UNIQUE (name);


--
-- Name: sys_permission UQ_ba9809c4237d793d905045f04ed; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_permission
    ADD CONSTRAINT "UQ_ba9809c4237d793d905045f04ed" UNIQUE (code);


--
-- Name: house_deposit UQ_c4b85cd8686623a020b387beb95; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_deposit
    ADD CONSTRAINT "UQ_c4b85cd8686623a020b387beb95" UNIQUE ("contractCode");


--
-- Name: sys_role UQ_cf51756dc07761fea6b351e0615; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role
    ADD CONSTRAINT "UQ_cf51756dc07761fea6b351e0615" UNIQUE (code);


--
-- Name: sys_employee UQ_db41a624f47cae937ca94c5b1f0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee
    ADD CONSTRAINT "UQ_db41a624f47cae937ca94c5b1f0" UNIQUE (mobile);


--
-- Name: house_checkout UQ_e836d5456b9f888b91a93638112; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_checkout
    ADD CONSTRAINT "UQ_e836d5456b9f888b91a93638112" UNIQUE ("contractCode");


--
-- Name: house_sale UQ_f7f79feb309eaa6681193271ee0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_sale
    ADD CONSTRAINT "UQ_f7f79feb309eaa6681193271ee0" UNIQUE (code);


--
-- Name: IDX_07b33fdefcd7c3b9b56af0d1ce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_07b33fdefcd7c3b9b56af0d1ce" ON public.sys_employee_department USING btree ("sysEmployeeId");


--
-- Name: IDX_0af8a3b895ae67f16d600e2cfd; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_0af8a3b895ae67f16d600e2cfd" ON public.fin_cash_entry USING btree ("requestKey");


--
-- Name: IDX_204f27bcee2b705b8230beaf41; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_204f27bcee2b705b8230beaf41" ON public.refresh_token USING btree ("tokenHash");


--
-- Name: IDX_3a11c9c50720f3fb2bc9504796; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_3a11c9c50720f3fb2bc9504796" ON public.house_deal USING btree (contract_code);


--
-- Name: IDX_3c01fb3b944936cc3acbe64cfd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3c01fb3b944936cc3acbe64cfd" ON public.sys_role_permission USING btree ("sysPermissionId");


--
-- Name: IDX_549eeb7ddf268720866b831291; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_549eeb7ddf268720866b831291" ON public.sys_employee_position USING btree ("sysEmployeeId");


--
-- Name: IDX_59158667b71b4225fb1dd30bf8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_59158667b71b4225fb1dd30bf8" ON public.sys_employee_store USING btree ("sysStoreId");


--
-- Name: IDX_5c592b6322f1dc9f4053f4f5d8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5c592b6322f1dc9f4053f4f5d8" ON public.sys_employee_position USING btree ("sysPositionId");


--
-- Name: IDX_653fe0734280f0f2a29ded3ffb; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_653fe0734280f0f2a29ded3ffb" ON public.house_deal USING btree (rental_appointment_id);


--
-- Name: IDX_76ffa68ca4ab82e20d6bcd24a4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_76ffa68ca4ab82e20d6bcd24a4" ON public.sys_employee_group USING btree ("sysEmployeeId");


--
-- Name: IDX_8a7b11a66fad89420ab2ec462c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8a7b11a66fad89420ab2ec462c" ON public.sys_employee_group USING btree ("sysGroupId");


--
-- Name: IDX_8e913e288156c133999341156a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8e913e288156c133999341156a" ON public.refresh_token USING btree ("userId");


--
-- Name: IDX_9cd5e80980d62de1096d5c9fde; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9cd5e80980d62de1096d5c9fde" ON public.sys_employee_store USING btree ("sysEmployeeId");


--
-- Name: IDX_a3e15e15c47c77e20edc9ccdbb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a3e15e15c47c77e20edc9ccdbb" ON public.sys_employee_department USING btree ("sysDepartmentId");


--
-- Name: IDX_ad55bb5f86ba3c7b9a9dbb3a8c; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_ad55bb5f86ba3c7b9a9dbb3a8c" ON public.fin_contract_schedule USING btree (deal_id, sequence);


--
-- Name: IDX_b49b107633b01ee4f2ef02fb70; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b49b107633b01ee4f2ef02fb70" ON public.sys_employee_role USING btree ("sysRoleId");


--
-- Name: IDX_c44b9e91a9dfe4034216024a64; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c44b9e91a9dfe4034216024a64" ON public.sys_employee_role USING btree ("sysEmployeeId");


--
-- Name: IDX_c93e89a613e501638b4e700de8; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_c93e89a613e501638b4e700de8" ON public.fin_property_configuration USING btree (property_id);


--
-- Name: IDX_e66d72347f29f1ab4e87312080; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_e66d72347f29f1ab4e87312080" ON public.house_deal USING btree (sale_appointment_id);


--
-- Name: IDX_ee9e9da7a4de0ab7a56a7c8955; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ee9e9da7a4de0ab7a56a7c8955" ON public.sys_role_permission USING btree ("sysRoleId");


--
-- Name: IDX_f185f1fc5614b01deddde75b0c; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_f185f1fc5614b01deddde75b0c" ON public.fin_cash_account USING btree (code);


--
-- Name: IDX_fdd0e90fbee520d5fd677c92b0; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_fdd0e90fbee520d5fd677c92b0" ON public.fin_business_charge USING btree (source_key);


--
-- Name: IDX_rental_appointment_contract_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_rental_appointment_contract_code" ON public.house_rental_appointment USING btree (contract_code);


--
-- Name: sys_employee_department FK_07b33fdefcd7c3b9b56af0d1ce5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_department
    ADD CONSTRAINT "FK_07b33fdefcd7c3b9b56af0d1ce5" FOREIGN KEY ("sysEmployeeId") REFERENCES public.sys_employee(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_store FK_1aaa9d97d55548a241183508fdf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_store
    ADD CONSTRAINT "FK_1aaa9d97d55548a241183508fdf" FOREIGN KEY (manager_id) REFERENCES public.sys_employee(id);


--
-- Name: sys_store FK_2f0532ad406970325aa2b724061; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_store
    ADD CONSTRAINT "FK_2f0532ad406970325aa2b724061" FOREIGN KEY (city_id) REFERENCES public.sys_city(id);


--
-- Name: sys_role_permission FK_3c01fb3b944936cc3acbe64cfdd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT "FK_3c01fb3b944936cc3acbe64cfdd" FOREIGN KEY ("sysPermissionId") REFERENCES public.sys_permission(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_group FK_46ec817f849639a3c4c893be3b3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_group
    ADD CONSTRAINT "FK_46ec817f849639a3c4c893be3b3" FOREIGN KEY (store_id) REFERENCES public.sys_store(id);


--
-- Name: sys_role FK_50ff8206dca99af22ae7f31db6e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role
    ADD CONSTRAINT "FK_50ff8206dca99af22ae7f31db6e" FOREIGN KEY (parent_id) REFERENCES public.sys_role(id);


--
-- Name: sys_employee_position FK_549eeb7ddf268720866b8312911; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_position
    ADD CONSTRAINT "FK_549eeb7ddf268720866b8312911" FOREIGN KEY ("sysEmployeeId") REFERENCES public.sys_employee(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_employee_store FK_59158667b71b4225fb1dd30bf8d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_store
    ADD CONSTRAINT "FK_59158667b71b4225fb1dd30bf8d" FOREIGN KEY ("sysStoreId") REFERENCES public.sys_store(id);


--
-- Name: sys_employee_position FK_5c592b6322f1dc9f4053f4f5d84; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_position
    ADD CONSTRAINT "FK_5c592b6322f1dc9f4053f4f5d84" FOREIGN KEY ("sysPositionId") REFERENCES public.sys_position(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: house_room_code FK_609c356b4005dd526d1def553dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_room_code
    ADD CONSTRAINT "FK_609c356b4005dd526d1def553dd" FOREIGN KEY (floor_id) REFERENCES public.house_floor(id);


--
-- Name: house_unit FK_69cbd9e1d8d89b9ddfbffc50c9d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_unit
    ADD CONSTRAINT "FK_69cbd9e1d8d89b9ddfbffc50c9d" FOREIGN KEY (building_id) REFERENCES public.house_building(id);


--
-- Name: sys_employee_group FK_76ffa68ca4ab82e20d6bcd24a40; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_group
    ADD CONSTRAINT "FK_76ffa68ca4ab82e20d6bcd24a40" FOREIGN KEY ("sysEmployeeId") REFERENCES public.sys_employee(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_dict_item FK_78fe7baa7dfbc99f3c89a479b10; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_dict_item
    ADD CONSTRAINT "FK_78fe7baa7dfbc99f3c89a479b10" FOREIGN KEY (dict_code) REFERENCES public.sys_dict(code);


--
-- Name: house_sale FK_842b474fa6ae838f6345433e647; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_sale
    ADD CONSTRAINT "FK_842b474fa6ae838f6345433e647" FOREIGN KEY (maintainer_id) REFERENCES public.sys_employee(id);


--
-- Name: sys_employee_group FK_8a7b11a66fad89420ab2ec462cd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_group
    ADD CONSTRAINT "FK_8a7b11a66fad89420ab2ec462cd" FOREIGN KEY ("sysGroupId") REFERENCES public.sys_group(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: house_rental_room FK_98651dfa1b6a5d9e3389df93fe9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_room
    ADD CONSTRAINT "FK_98651dfa1b6a5d9e3389df93fe9" FOREIGN KEY (set_id) REFERENCES public.house_rental_set(id);


--
-- Name: sys_employee_store FK_9cd5e80980d62de1096d5c9fde1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_store
    ADD CONSTRAINT "FK_9cd5e80980d62de1096d5c9fde1" FOREIGN KEY ("sysEmployeeId") REFERENCES public.sys_employee(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: house_rental_set FK_9e7eb39fd8969e41e3e43c4e6b6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_set
    ADD CONSTRAINT "FK_9e7eb39fd8969e41e3e43c4e6b6" FOREIGN KEY (community_id) REFERENCES public.house_community(id);


--
-- Name: sys_city FK_9ef6df2be1f29641e6e4f9b0b59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_city
    ADD CONSTRAINT "FK_9ef6df2be1f29641e6e4f9b0b59" FOREIGN KEY (company_id) REFERENCES public.sys_company(id);


--
-- Name: sys_employee_department FK_a3e15e15c47c77e20edc9ccdbb3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_department
    ADD CONSTRAINT "FK_a3e15e15c47c77e20edc9ccdbb3" FOREIGN KEY ("sysDepartmentId") REFERENCES public.sys_department(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_employee_role FK_b49b107633b01ee4f2ef02fb703; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_role
    ADD CONSTRAINT "FK_b49b107633b01ee4f2ef02fb703" FOREIGN KEY ("sysRoleId") REFERENCES public.sys_role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: house_building FK_bf452950650c702ae54075caac9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_building
    ADD CONSTRAINT "FK_bf452950650c702ae54075caac9" FOREIGN KEY (community_id) REFERENCES public.house_community(id);


--
-- Name: house_sale FK_bf93093c0f32bdf800f4f938e28; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_sale
    ADD CONSTRAINT "FK_bf93093c0f32bdf800f4f938e28" FOREIGN KEY (community_id) REFERENCES public.house_community(id);


--
-- Name: sys_employee_role FK_c44b9e91a9dfe4034216024a64d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_employee_role
    ADD CONSTRAINT "FK_c44b9e91a9dfe4034216024a64d" FOREIGN KEY ("sysEmployeeId") REFERENCES public.sys_employee(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sys_department FK_cd927ea032b8c2c102689f2803e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_department
    ADD CONSTRAINT "FK_cd927ea032b8c2c102689f2803e" FOREIGN KEY (store_id) REFERENCES public.sys_store(id);


--
-- Name: house_rental_appointment_action FK_d8313eaf5e96db82edefeb68476; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_rental_appointment_action
    ADD CONSTRAINT "FK_d8313eaf5e96db82edefeb68476" FOREIGN KEY (appointment_id) REFERENCES public.house_rental_appointment(id) ON DELETE CASCADE;


--
-- Name: house_floor FK_e6187b93cb94736fe31d682ee03; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.house_floor
    ADD CONSTRAINT "FK_e6187b93cb94736fe31d682ee03" FOREIGN KEY (unit_id) REFERENCES public.house_unit(id);


--
-- Name: sys_role_permission FK_ee9e9da7a4de0ab7a56a7c89551; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_role_permission
    ADD CONSTRAINT "FK_ee9e9da7a4de0ab7a56a7c89551" FOREIGN KEY ("sysRoleId") REFERENCES public.sys_role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Tb7erhES0r15ksNOzcf0Docym216vSguMobVQu564u5jGzDag9KFnKeFB8xkqV3

